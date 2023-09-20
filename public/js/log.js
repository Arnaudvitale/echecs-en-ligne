const mediaQuery = window.matchMedia("(max-width: 600px)");
if (mediaQuery.matches) {
  // phone user
  window.location.href = "/phone/loginphone.html";
} else {
  // pc user
  window.location.href = "/pc/loginpc.html";
}