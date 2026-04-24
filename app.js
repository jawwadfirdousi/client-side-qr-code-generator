const modeConfig = {
  url: {
    label: "URL",
    ready: "Ready for a URL.",
    generated: "URL QR code generated.",
  },
  pdf: {
    label: "PDF",
    ready: "Ready for a PDF link.",
    generated: "PDF QR code generated.",
  },
  contact: {
    label: "Contact",
    ready: "Ready for contact details.",
    generated: "Contact QR code generated.",
  },
  text: {
    label: "Plain Text",
    ready: "Ready for plain text.",
    generated: "Plain text QR code generated.",
  },
  app: {
    label: "App",
    ready: "Ready for an app link.",
    generated: "App QR code generated.",
  },
  sms: {
    label: "SMS",
    ready: "Ready for an SMS target.",
    generated: "SMS QR code generated.",
  },
  email: {
    label: "Email",
    ready: "Ready for an email draft.",
    generated: "Email QR code generated.",
  },
  phone: {
    label: "Phone",
    ready: "Ready for a phone number.",
    generated: "Phone QR code generated.",
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const modeButtons = [...document.querySelectorAll(".mode-button")];
const modePanels = [...document.querySelectorAll("[data-panel-mode]")];
const form = document.getElementById("qr-form");
const output = document.getElementById("qr-output");
const payloadPreview = document.getElementById("payload-preview");
const statusMessage = document.getElementById("status-message");

const inputs = {
  urlValue: document.getElementById("url-value"),
  pdfUrl: document.getElementById("pdf-url"),
  contactName: document.getElementById("contact-name"),
  contactPhone: document.getElementById("contact-phone"),
  contactEmail: document.getElementById("contact-email"),
  contactCompany: document.getElementById("contact-company"),
  contactTitle: document.getElementById("contact-title"),
  contactWebsite: document.getElementById("contact-website"),
  textValue: document.getElementById("text-value"),
  appUrl: document.getElementById("app-url"),
  smsPhone: document.getElementById("sms-phone"),
  smsMessage: document.getElementById("sms-message"),
  emailAddress: document.getElementById("email-address"),
  emailSubject: document.getElementById("email-subject"),
  emailBody: document.getElementById("email-body"),
  phoneNumber: document.getElementById("phone-number"),
};

const payloadBuilders = {
  url: buildUrlPayload,
  pdf: buildPdfPayload,
  contact: buildContactPayload,
  text: buildTextPayload,
  app: buildAppPayload,
  sms: buildSmsPayload,
  email: buildEmailPayload,
  phone: buildPhonePayload,
};

let activeMode = "url";

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

setMode(activeMode);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const payload = buildPayloadForMode(activeMode);
    renderQrCode(payload);
    payloadPreview.textContent = payload;
    setStatus(modeConfig[activeMode].generated);
  } catch (error) {
    setStatus(error.message, true);
  }
});

function setMode(mode) {
  if (!modeConfig[mode]) {
    return;
  }

  activeMode = mode;

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  modePanels.forEach((panel) => {
    const isActive = panel.dataset.panelMode === mode;
    panel.hidden = !isActive;
    panel.style.display = isActive ? "grid" : "none";
  });

  resetPreview();
  setStatus(modeConfig[mode].ready);
}

function buildPayloadForMode(mode) {
  const buildPayload = payloadBuilders[mode];

  if (!buildPayload) {
    throw new Error("This QR type is not available yet.");
  }

  return buildPayload();
}

function buildUrlPayload() {
  return normalizeLink(inputs.urlValue.value, "URL");
}

function buildPdfPayload() {
  return normalizeLink(inputs.pdfUrl.value, "PDF URL");
}

function buildContactPayload() {
  const fullName = inputs.contactName.value.trim();
  const email = inputs.contactEmail.value.trim();
  const website = inputs.contactWebsite.value.trim();
  const phone = inputs.contactPhone.value.trim();

  if (!fullName) {
    throw new Error("Enter a contact name first.");
  }

  const validatedEmail = email ? validateEmail(email, "email address") : "";
  const normalizedWebsite = website
    ? normalizeLink(website, "website URL")
    : "";
  const normalizedPhone = phone
    ? normalizePhoneNumber(phone, "phone number")
    : "";
  const { firstName, lastName } = splitName(fullName);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
    `FN:${escapeVCard(fullName)}`,
  ];

  addLine(lines, "ORG", inputs.contactCompany.value);
  addLine(lines, "TITLE", inputs.contactTitle.value);
  addLine(lines, "TEL;TYPE=CELL", normalizedPhone);
  addLine(lines, "EMAIL", validatedEmail);
  addLine(lines, "URL", normalizedWebsite);
  lines.push("END:VCARD");

  return lines.join("\n");
}

function buildTextPayload() {
  const value = inputs.textValue.value;

  if (!value.trim()) {
    throw new Error("Enter some text first.");
  }

  return value;
}

function buildAppPayload() {
  return normalizeLink(inputs.appUrl.value, "app link");
}

function buildSmsPayload() {
  const phone = normalizePhoneNumber(inputs.smsPhone.value, "phone number");
  const message = inputs.smsMessage.value.trim();

  return message ? `SMSTO:${phone}:${message}` : `SMSTO:${phone}`;
}

function buildEmailPayload() {
  const recipient = validateEmail(
    inputs.emailAddress.value.trim(),
    "recipient email address"
  );
  const subject = inputs.emailSubject.value.trim();
  const body = inputs.emailBody.value.trim();
  const params = new URLSearchParams();

  if (subject) {
    params.set("subject", subject);
  }

  if (body) {
    params.set("body", body);
  }

  const query = params.toString();

  return query ? `mailto:${recipient}?${query}` : `mailto:${recipient}`;
}

function buildPhonePayload() {
  return `tel:${normalizePhoneNumber(inputs.phoneNumber.value, "phone number")}`;
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

function normalizeLink(value, fieldName) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`Enter a ${fieldName} first.`);
  }

  const candidate = /^[a-z][a-z\d+\-.]*:/i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    return new URL(candidate).toString();
  } catch {
    throw new Error(`Enter a valid ${fieldName}.`);
  }
}

function normalizePhoneNumber(value, fieldName) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`Enter a ${fieldName} first.`);
  }

  const normalizedValue = trimmedValue.replace(/[.\s()-]/g, "");

  if (!/^\+?\d{5,}$/.test(normalizedValue)) {
    throw new Error(`Enter a valid ${fieldName}.`);
  }

  return normalizedValue;
}

function validateEmail(value, fieldName) {
  if (!value) {
    throw new Error(`Enter a ${fieldName} first.`);
  }

  if (!EMAIL_PATTERN.test(value)) {
    throw new Error(`Enter a valid ${fieldName}.`);
  }

  return value;
}

function renderQrCode(payload) {
  const qr = qrcode(0, "M");
  qr.addData(payload);
  qr.make();

  output.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });

  const svg = output.querySelector("svg");

  if (svg) {
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      `QR code for ${modeConfig[activeMode].label.toLowerCase()}`
    );
  }
}

function resetPreview() {
  output.innerHTML = '<p class="empty-state">Your QR code will appear here.</p>';
  payloadPreview.textContent = "No payload generated yet.";
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
}
