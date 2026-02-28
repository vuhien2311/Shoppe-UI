(function (window) {
  const cfg = window.ShopeeConfig;
  const state = window.ShopeeState;
  const ui = window.ShopeeUI;
  const validators = window.ShopeeValidators;
  const clipboard = window.ShopeeClipboard;
  const api = window.ShopeeApi;
  const cacheKey = cfg.INPUT_CACHE_KEY || "shopee_converter_input_cache";
  let waitTicker = null;

  function saveInputCache(value) {
    try {
      window.localStorage.setItem(cacheKey, String(value || ""));
    } catch (_) {}
  }

  function stopWaitTicker() {
    if (!waitTicker) return;
    clearInterval(waitTicker);
    waitTicker = null;
  }

  function startWaitTicker(shortJobId) {
    stopWaitTicker();
    const startedAt = Date.now();

    const render = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      ui.setStatus(`Đã nhận yêu cầu #${shortJobId}, đang xử lý ${seconds}s...`);
      ui.setResultPreview(`Đang xử lý job #${shortJobId} (${seconds}s)...`);
    };

    render();
    waitTicker = setInterval(render, 1000);
  }

  async function handlePasteFromClipboard() {
    ui.setStatus("");

    try {
      const text = await clipboard.readClipboardText();
      if (!text) {
        ui.setStatus("Clipboard trống. Hãy copy link Shopee trước.");
        return;
      }

      const cleaned = validators.normalizeSingleShopeeLink(text);
      ui.setInput(cleaned);
      saveInputCache(cleaned);
      ui.resetGenerated();
      ui.setStatus("Đã dán link từ clipboard.");
    } catch (err) {
      const msg = String(err && err.message ? err.message : "");
      if (msg.includes("Chỉ cho phép 1 link") || msg.includes("Chỉ dán đúng 1 link") || msg.includes("Chỉ hỗ trợ link Shopee")) {
        ui.setStatus(msg);
        return;
      }

      ui.focusInput();
      ui.setStatus("Trình duyệt chặn đọc clipboard. Hãy nhấn Ctrl/Cmd+V để dán 1 link vào ô nhập.");
    }
  }

  async function handleConvert() {
    ui.setStatus("");
    if (state.isConverting()) return;

    const now = Date.now();
    if (now - state.getLastConvertAt() < cfg.MIN_CONVERT_INTERVAL_MS) {
      ui.setStatus("Bạn thao tác quá nhanh, vui lòng thử lại sau 1 giây.");
      return;
    }

    const currentRawInput = window.ShopeeDom && window.ShopeeDom.inp ? window.ShopeeDom.inp.value : ui.getInput();
    const raw = String(currentRawInput || "").trim();
    if (!raw) {
      ui.resetGenerated();
      ui.showDefaultResult();
      ui.setStatus("Bạn chưa nhập link.");
      return;
    }

    try {
      const cleaned = validators.normalizeSingleShopeeLink(raw);
      saveInputCache(currentRawInput);

      ui.setBusy(true);
      state.setLastConvertAt(now);
      ui.setResultPreview("Đang chuyển đổi...");
      ui.setStatus("Đang gửi yêu cầu convert...");

      const jobId = await api.createJob(cleaned);
      const shortJobId = String(jobId || "").slice(0, 8);
      startWaitTicker(shortJobId);

      const full = await api.waitForJob(jobId);
      stopWaitTicker();
      ui.setGenerated(full);
      ui.setStatus("Đã tạo link. Bạn có thể Sao chép hoặc Mở.");
    } catch (err) {
      stopWaitTicker();
      const message = (err && err.message) || "Không chuyển đổi được";
      ui.resetGenerated();
      ui.setResultPreview(`Lỗi: ${message}`);
      ui.setStatus(message);
    } finally {
      stopWaitTicker();
      // Keep original input even if page state is interrupted/reloaded.
      if (window.ShopeeDom && window.ShopeeDom.inp) {
        if (!window.ShopeeDom.inp.value) {
          window.ShopeeDom.inp.value = currentRawInput;
        }
        saveInputCache(window.ShopeeDom.inp.value);
      }
      ui.setBusy(false);
    }
  }

  async function handleCopy() {
    ui.setStatus("");
    const lastFull = state.getLastFull();

    if (!lastFull) {
      ui.setStatus("Chưa có link. Hãy bấm “Nhận voucher” trước.");
      return;
    }

    const ok = await clipboard.copyText(lastFull);
    if (ok) {
      ui.showCopySuccess();
      ui.setStatus("Đã copy link vào clipboard.");
      return;
    }

    ui.setStatus("Không copy được do trình duyệt chặn. Hãy copy thủ công.");
  }

  function handleOpen() {
    ui.setStatus("");
    const lastFull = state.getLastFull();

    if (!lastFull) {
      ui.setStatus("Chưa có link. Hãy bấm “Nhận voucher” trước.");
      return;
    }

    window.open(lastFull, "_blank", "noopener,noreferrer");
  }

  function handleInputPaste(event) {
    ui.setStatus("");
    const text = (event.clipboardData && event.clipboardData.getData("text")) || "";
    if (!text) return;

    try {
      validators.normalizeSingleShopeeLink(text);
      ui.resetGenerated();
      ui.setStatus("Đã dán 1 link hợp lệ.");
      setTimeout(() => {
        if (window.ShopeeDom && window.ShopeeDom.inp) {
          saveInputCache(window.ShopeeDom.inp.value);
        }
      }, 0);
    } catch (err) {
      event.preventDefault();
      ui.resetGenerated();
      ui.setStatus((err && err.message) || "Nội dung dán không hợp lệ.");
    }
  }

  function handleInputChange() {
    ui.setStatus("");
    ui.resetGenerated();
    if (window.ShopeeDom && window.ShopeeDom.inp) {
      saveInputCache(window.ShopeeDom.inp.value);
    }
  }

  window.ShopeeActions = {
    handlePasteFromClipboard,
    handleConvert,
    handleCopy,
    handleOpen,
    handleInputPaste,
    handleInputChange
  };
})(window);
