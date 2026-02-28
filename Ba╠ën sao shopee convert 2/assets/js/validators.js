(function (window) {
  const cfg = window.ShopeeConfig;

  function isShopeeHost(host) {
    if (!host) return false;
    const h = String(host).toLowerCase();
    if (/(^|\.)shopee\./i.test(h)) return true;
    // Short link domains
    if (h === "shp.ee" || h.endsWith(".shp.ee")) return true;
    return false;
  }

  function extractUrls(text) {
    const rx = new RegExp(cfg.URL_REGEX.source, "gi");
    return (text || "").match(rx) || [];
  }

  function normalizeSingleShopeeLink(raw) {
    const value = String(raw || "").trim();
    if (!value) throw new Error("Bạn chưa nhập link.");

    const urls = extractUrls(value);
    if (urls.length === 0) throw new Error("Vui lòng dán link đầy đủ bắt đầu bằng http/https.");
    if (urls.length > 1) throw new Error("Chỉ cho phép 1 link mỗi lần convert.");

    const urlText = urls[0].trim();
    if (value !== urlText) {
      throw new Error("Chỉ dán đúng 1 link, không kèm nhiều link hoặc nội dung khác.");
    }

    let parsed;
    try {
      parsed = new URL(urlText);
    } catch (_) {
      throw new Error("Link không hợp lệ.");
    }

    if (!isShopeeHost(parsed.hostname)) {
      throw new Error("Chỉ hỗ trợ link Shopee.");
    }

    return parsed.toString();
  }

  window.ShopeeValidators = {
    normalizeSingleShopeeLink
  };
})(window);
