// GOAT KILLER — interactive features
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* Mobile navigation */
const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

function closeMenu() {
  navLinks.classList.remove("open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "☰";
}
menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  document.body.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "×" : "☰";
});
$$(".nav-links a").forEach(link => link.addEventListener("click", closeMenu));

/* Animate elements as they enter the viewport */
const revealItems = $$(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(el => observer.observe(el));
} else {
  revealItems.forEach(el => el.classList.add("visible"));
}

/* Product category filters */
const filters = $$(".filter");
const productCards = $$(".product-card");

filters.forEach(button => {
  button.addEventListener("click", () => {
    filters.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const category = button.dataset.filter;
    productCards.forEach(card => {
      card.hidden = category !== "All" && card.dataset.category !== category;
    });
  });
});

$$("[data-category-link]").forEach(link => {
  link.addEventListener("click", () => {
    const category = link.dataset.categoryLink;
    const button = filters.find(item => item.dataset.filter === category);
    if (button) button.click();
  });
});

/* Shopping bag drawer */
let cart = [];
const drawer = $("#cartDrawer");
const overlay = $("#cartOverlay");

function openCart() {
  drawer.classList.add("open");
  overlay.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("#closeCart").focus();
}
function closeCart() {
  drawer.classList.remove("open");
  overlay.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  $("#openCart").focus();
}
$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeCart();
    closeMenu();
  }
});

function formatPrice(price) {
  return "₹" + Number(price).toLocaleString("en-IN");
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[char]);
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function renderCart() {
  $("#cartCount").textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartItems = $("#cartItems");
  if (!cart.length) {
    cartItems.innerHTML = '<p class="cart-empty">Your bag is empty. Let’s find your gear.</p>';
  } else {
    cartItems.innerHTML = cart.map((item, index) => `
      <div class="cart-line">
        <div><h4>${escapeHTML(item.name)}</h4><p>${formatPrice(item.price)} × ${item.qty}</p></div>
        <div style="text-align:right"><strong>${formatPrice(item.price * item.qty)}</strong><br>
          <button class="remove-item" data-remove="${index}">REMOVE</button>
        </div>
      </div>`).join("");
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $("#cartTotal").textContent = formatPrice(total);
}

/* Add products to bag */
$("#productGrid").addEventListener("click", e => {
  const button = e.target.closest(".add-button");
  if (!button) return;
  const card = button.closest(".product-card");
  const name = card.dataset.name;
  const price = Number(card.dataset.price);
  const existing = cart.find(item => item.name === name);
  if (existing) existing.qty += 1;
  else cart.push({ name, price, qty: 1 });
  renderCart();
  showToast(name + " added to your bag!");
  const originalText = button.textContent;
  button.textContent = "ADDED ✓";
  setTimeout(() => button.textContent = originalText, 1200);
});

/* Remove a product from the bag */
$("#cartItems").addEventListener("click", e => {
  const button = e.target.closest("[data-remove]");
  if (!button) return;
  cart.splice(Number(button.dataset.remove), 1);
  renderCart();
});

/* WhatsApp checkout: opens a prepared order enquiry */
$("#checkoutButton").addEventListener("click", () => {
  if (!cart.length) {
    showToast("Your bag is empty!");
    return;
  }
  const lines = cart.map(item =>
    `${item.name} x ${item.qty} — ${formatPrice(item.price * item.qty)}`
  );
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const message = [
    "Hello GOAT KILLER! I'd like to place an order:",
    "", ...lines, "", "Total: " + formatPrice(total),
    "Please confirm availability and delivery details."
  ].join("\n");
  window.open(
    "https://wa.me/918091023582?text=" + encodeURIComponent(message),
    "_blank", "noopener"
  );
});

/* Contact form: opens a pre-filled email draft.
   A live website form needs a backend or form service. */
$("#contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#customerName").value.trim();
  const phone = $("#customerPhone").value.trim();
  const email = $("#customerEmail").value.trim();
  const message = $("#customerMessage").value.trim();
  if (!name || !email || !message) {
    $("#formStatus").textContent = "Please fill in your name, email and message.";
    return;
  }
  const subject = "GOAT KILLER enquiry from " + name;
  const body = [
    "Name: " + name, "Phone: " + (phone || "Not provided"),
    "Email: " + email, "", "Message:", message
  ].join("\n");
  $("#formStatus").textContent = "Opening your email app to send your enquiry...";
  window.location.href = "mailto:rijwal@gmail.com?subject=" +
    encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
});

/* Set initial cart display */
renderCart();
