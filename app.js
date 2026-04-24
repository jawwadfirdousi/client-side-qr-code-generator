const modeButtons = [...document.querySelectorAll(".mode-button")];
const websiteFields = document.getElementById("website-fields");
const contactFields = document.getElementById("contact-fields");
const form = document.getElementById("qr-form");
const output = document.getElementById("qr-output");
const payloadPreview = document.getElementById("payload-preview");
const statusMessage = document.getElementById("status-message");

const inputs = {
  websiteUrl: document.getElementById("website-url"),
  contactName: document.getElementById("contact-name"),
  contactPhone: document.getElementById("contact-phone"),
  contactEmail: document.getElementById("contact-email"),
  contactCompany: document.getElementById("contact-company"),
  contactTitle: document.getElementById("contact-title"),
  contactWebsite: document.getElementById("contact-website"),
};

let activeMode = "website";

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

setMode(activeMode);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const payload =
      activeMode === "website" ? buildWebsitePayload() : buildContactPayload();

    renderQrCode(payload);
    payloadPreview.textContent = payload;
    setStatus(
      activeMode === "website"
        ? "Website QR code generated."
        : "Contact QR code generated."
    );
  } catch (error) {
    setStatus(error.message, true);
  }
});

function setMode(mode) {
  activeMode = mode;
  const showingWebsite = mode === "website";

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  websiteFields.hidden = !showingWebsite;
  websiteFields.style.display = showingWebsite ? "grid" : "none";
  contactFields.hidden = showingWebsite;
  contactFields.style.display = showingWebsite ? "none" : "grid";

  setStatus(
    showingWebsite
      ? "Ready for a website URL."
      : "Ready for contact details."
  );
}

function buildWebsitePayload() {
  const rawUrl = inputs.websiteUrl.value.trim();

  if (!rawUrl) {
    throw new Error("Enter a website URL first.");
  }

  return normalizeUrl(rawUrl);
}

function buildContactPayload() {
  const fullName = inputs.contactName.value.trim();
  const email = inputs.contactEmail.value.trim();
  const website = inputs.contactWebsite.value.trim();

  if (!fullName) {
    throw new Error("Enter a contact name first.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const normalizedWebsite = website ? normalizeUrl(website) : "";
  const { firstName, lastName } = splitName(fullName);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
    `FN:${escapeVCard(fullName)}`,
  ];

  addLine(lines, "ORG", inputs.contactCompany.value);
  addLine(lines, "TITLE", inputs.contactTitle.value);
  addLine(lines, "TEL;TYPE=CELL", inputs.contactPhone.value);
  addLine(lines, "EMAIL", email);
  addLine(lines, "URL", normalizedWebsite);
  lines.push("END:VCARD");

  return lines.join("\n");
}

function addLine(lines, key, value) {
  const normalizedValue = value.trim();

  if (normalizedValue) {
    lines.push(`${key}:${escapeVCard(normalizedValue)}`);
  }
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");

  return { firstName, lastName };
}

function escapeVCard(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function normalizeUrl(value) {
  const urlWithScheme = /^[a-z][a-z\d+\-.]*:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    return new URL(urlWithScheme).toString();
  } catch {
    throw new Error("Enter a valid website URL.");
  }
}

function renderQrCode(payload) {
  const qr = qrcode(0, "M");
  qr.addData(payload);
  qr.make();

  output.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });

  const svg = output.querySelector("svg");

  if (svg) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `QR code for ${activeMode}`);
  }
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
}
