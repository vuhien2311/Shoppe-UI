(function (window) {
  const state = {
    lastFull: "",
    isConverting: false,
    lastConvertAt: 0
  };

  function setLastFull(value) {
    state.lastFull = value || "";
  }

  function getLastFull() {
    return state.lastFull;
  }

  function setConverting(value) {
    state.isConverting = Boolean(value);
  }

  function isConverting() {
    return state.isConverting;
  }

  function setLastConvertAt(value) {
    state.lastConvertAt = Number(value) || 0;
  }

  function getLastConvertAt() {
    return state.lastConvertAt;
  }

  window.ShopeeState = {
    setLastFull,
    getLastFull,
    setConverting,
    isConverting,
    setLastConvertAt,
    getLastConvertAt
  };
})(window);
