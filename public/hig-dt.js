/** Dynamic Type (v7 HIG): --dt-scale / ?dt= / localStorage; cap 2.0 (≥200%). */
(function () {
  function applyDynamicType() {
    try {
      var root = document.documentElement;
      var scale = parseFloat(root.style.getPropertyValue("--dt-scale")) ||
        parseFloat(getComputedStyle(root).getPropertyValue("--dt-scale")) || 1;
      var q = new URLSearchParams(location.search).get("dt");
      if (q) scale = parseFloat(q) || scale;
      try {
        var key = (location.pathname.split("/").filter(Boolean)[0] || "cap") + "-dt-scale";
        var stored = localStorage.getItem(key) || localStorage.getItem("vc-dt-scale");
        if (stored && !q) scale = parseFloat(stored) || scale;
      } catch (_) {}
      scale = Math.min(2.0, Math.max(0.85, scale));
      root.style.setProperty("--dt-scale", scale.toFixed(3));
      root.dataset.dtScale = scale.toFixed(2);
      document.dispatchEvent(new Event("cap-text-size"));
    } catch (e) {}
  }
  window.applyDynamicType = applyDynamicType;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyDynamicType);
  else applyDynamicType();
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) applyDynamicType();
  });
})();
