(function() {
  var placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) return;
  fetch('assets/includes/footer.html')
    .then(function(r) { return r.text(); })
    .then(function(html) {
      placeholder.outerHTML = html;
    })
    .catch(function() {
      placeholder.outerHTML = '<footer class="site-footer"><div class="container"><div class="footer-bottom">&copy; 2026 TipTop Namkeen</div></div></footer>';
    });
})();
