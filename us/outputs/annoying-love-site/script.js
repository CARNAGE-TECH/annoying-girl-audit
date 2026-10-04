const slides = [...document.querySelectorAll(".slide")];
const dots = [...document.querySelectorAll(".progress-dot")];
const meterValue = document.querySelector("#meterValue");
const meterFill = document.querySelector("#meterFill");
const toast = document.querySelector("#toast");
const confettiBtn = document.querySelector("#confettiBtn");

const NO_MESSAGE = "Nope. The website refuses to accept that answer.";
const SLIDE_LOCK_MS = 450;
const FINAL_METER = 101; // the meter overflows on the last slide, for fun

let currentSlide = 0;
let toastTimer;
let lastDodgeAt = 0;
let navLockedUntil = 0;

function updateMeter(value) {
  meterValue.textContent = `${value}%`;
  meterFill.style.width = `${value}%`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function resetNoButtons() {
  document.querySelectorAll(".no-answer").forEach((button) => {
    button.classList.remove("running");
    button.style.left = "";
    button.style.top = "";
    button.style.transform = "";
  });
}

function goToSlide(index) {
  if (index < 0 || index >= slides.length || index === currentSlide) {
    return;
  }

  const oldSlide = slides[currentSlide];
  const nextSlide = slides[index];
  oldSlide.classList.add("exit-left");
  oldSlide.classList.remove("active");
  nextSlide.classList.add("active");

  currentSlide = index;
  dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
  resetNoButtons();

  if (nextSlide.dataset.meter) {
    updateMeter(Number(nextSlide.dataset.meter));
  } else if (index === slides.length - 1) {
    updateMeter(FINAL_METER);
  }

  // Keep keyboard users oriented: the clicked button just became hidden.
  const focusTarget = nextSlide.querySelector("[data-autofocus]") || nextSlide.querySelector(".primary");
  if (focusTarget) {
    focusTarget.focus({ preventScroll: true });
  }

  window.setTimeout(() => oldSlide.classList.remove("exit-left"), 560);
}

function nextSlide() {
  // Guards against double-clicks and a held-down Enter key skipping a slide.
  const now = performance.now();
  if (now < navLockedUntil) {
    return;
  }
  navLockedUntil = now + SLIDE_LOCK_MS;
  goToSlide(currentSlide + 1);
}

function moveButtonAway(button, pointerX, pointerY) {
  const now = performance.now();
  if (now - lastDodgeAt < 90) {
    return;
  }
  lastDodgeAt = now;

  const rect = button.getBoundingClientRect();
  const margin = 22;
  const maxX = window.innerWidth - rect.width - margin;
  const maxY = window.innerHeight - rect.height - margin;
  const minY = Math.min(maxY, 118);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const awayX = centerX - pointerX || (Math.random() > 0.5 ? 1 : -1);
  const awayY = centerY - pointerY || (Math.random() > 0.5 ? 1 : -1);
  const length = Math.hypot(awayX, awayY) || 1;
  const jump = Math.min(260, Math.max(150, window.innerWidth * 0.18));
  const currentX = rect.left;
  const currentY = rect.top;
  const jitterX = (Math.random() - 0.5) * 140;
  const jitterY = (Math.random() - 0.5) * 120;

  let nextX = currentX + (awayX / length) * jump + jitterX;
  let nextY = currentY + (awayY / length) * jump + jitterY;

  if (nextX <= margin || nextX >= maxX) {
    nextX = pointerX < window.innerWidth / 2 ? maxX : margin;
  }

  if (nextY <= minY || nextY >= maxY) {
    nextY = pointerY < window.innerHeight / 2 ? maxY : minY;
  }

  nextX = Math.min(maxX, Math.max(margin, nextX));
  nextY = Math.min(maxY, Math.max(minY, nextY));

  button.classList.add("running");
  button.style.left = `${nextX}px`;
  button.style.top = `${nextY}px`;
  button.style.transform = `rotate(${Math.round((Math.random() - 0.5) * 10)}deg)`;
}

// Dodge as if the "pointer" were sitting on the button itself (keyboard use).
function dodgeFromSelf(button) {
  const rect = button.getBoundingClientRect();
  moveButtonAway(button, rect.left + rect.width / 2, rect.top + rect.height / 2);
  showToast(NO_MESSAGE);
}

function guardNoButton(event) {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const pointerX = event.clientX || rect.left;
  const pointerY = event.clientY || rect.top;

  moveButtonAway(button, pointerX, pointerY);
  showToast(NO_MESSAGE);
}

function watchPointer(event) {
  const activeNo = slides[currentSlide].querySelector(".no-answer");
  if (!activeNo) {
    return;
  }

  const rect = activeNo.getBoundingClientRect();
  const buffer = 118;
  const isClose =
    event.clientX > rect.left - buffer &&
    event.clientX < rect.right + buffer &&
    event.clientY > rect.top - buffer &&
    event.clientY < rect.bottom + buffer;

  if (isClose) {
    moveButtonAway(activeNo, event.clientX, event.clientY);
  }
}

function launchConfetti() {
  const colors = ["#ff4f8b", "#ff8fb8", "#ffc9dc", "#d92a73", "#ffb3c7", "#ff5c9a"];

  confettiBtn.disabled = true;
  window.setTimeout(() => {
    confettiBtn.disabled = false;
  }, 1800);

  for (let i = 0; i < 52; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 420}ms`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), 2200);
  }

  showToast("Sentence accepted: annoying, loved, and absolutely guilty.");
}

document.querySelectorAll(".next-slide, .yes-answer").forEach((button) => {
  button.addEventListener("click", nextSlide);
});

document.querySelectorAll(".no-answer").forEach((button) => {
  button.addEventListener("pointerenter", guardNoButton);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    guardNoButton(event);
  });
  button.addEventListener("focus", () => dodgeFromSelf(button));
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    // detail === 0 means the click came from the keyboard (Enter or Space)
    if (event.detail === 0) {
      dodgeFromSelf(button);
    }
  });
});

// ---------- The rigged "how annoying are you" meter ----------

const rate = document.querySelector("#rate");
const rateTrack = document.querySelector("#rateTrack");
const rateReadout = document.querySelector("#rateReadout");
const rateNote = document.querySelector("#rateNote");
const rateLock = document.querySelector("#rateLock");

const RATE_WALL = 58; // anything past this and the meter snaps back
const RATE_THUMB = 44;
const SNAP_MS = 750;
const snapMessages = [
  "Nice try. The meter disagrees.",
  "Error: this person is too annoying to be rated higher.",
  "The meter has filed a complaint.",
  "Still no. Science is science.",
  "The meter is not even sorry.",
];

let rateValue = 0;
let rateDragging = false;
let rateSnapping = false;
let rateAttempts = 0;

function rateWord(value) {
  if (value < 12) return "Very annoying";
  if (value < 28) return "Still very annoying";
  if (value < 44) return "Annoying, but trying";
  return "Don't even think about it";
}

function setRate(value) {
  rateValue = value;
  rateTrack.style.setProperty("--p", value);
  rateTrack.classList.toggle("strained", value > 40);
  const word = rateWord(value);
  rateReadout.textContent = word;
  rateTrack.setAttribute("aria-valuenow", String(Math.round(value)));
  rateTrack.setAttribute("aria-valuetext", word);
}

function snapRateBack() {
  if (rateSnapping) {
    return;
  }

  rateSnapping = true;
  rateDragging = false;
  rateAttempts += 1;

  rateTrack.classList.add("snapping");
  rate.classList.remove("shake");
  void rate.offsetWidth; // restart the shake animation
  rate.classList.add("shake");
  setRate(0);

  rateNote.textContent = snapMessages[(rateAttempts - 1) % snapMessages.length];
  showToast("Meter says: very annoying.");
  rateLock.disabled = false;

  window.setTimeout(() => {
    rateTrack.classList.remove("snapping");
    rate.classList.remove("shake");
    rateSnapping = false;
  }, SNAP_MS);
}

function rateFromPointer(event) {
  const rect = rateTrack.getBoundingClientRect();
  const usable = Math.max(1, rect.width - RATE_THUMB);
  const raw = ((event.clientX - rect.left - RATE_THUMB / 2) / usable) * 100;
  const value = Math.min(100, Math.max(0, raw));

  if (value >= RATE_WALL) {
    if (rateTrack.hasPointerCapture?.(event.pointerId)) {
      rateTrack.releasePointerCapture(event.pointerId);
    }
    snapRateBack();
  } else {
    setRate(value);
  }
}

rateTrack.addEventListener("pointerdown", (event) => {
  if (rateSnapping) {
    return;
  }
  event.preventDefault();
  rateTrack.focus({ preventScroll: true });
  rateDragging = true;
  rateTrack.setPointerCapture(event.pointerId);
  rateFromPointer(event);
});

rateTrack.addEventListener("pointermove", (event) => {
  if (rateDragging && !rateSnapping) {
    rateFromPointer(event);
  }
});

["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => {
  rateTrack.addEventListener(name, () => {
    rateDragging = false;
  });
});

rateTrack.addEventListener("keydown", (event) => {
  const steps = {
    ArrowRight: 8,
    ArrowUp: 8,
    PageUp: 20,
    ArrowLeft: -8,
    ArrowDown: -8,
    PageDown: -20,
  };

  if (event.key === "Home") {
    event.preventDefault();
    setRate(0);
  } else if (event.key === "End") {
    event.preventDefault();
    snapRateBack();
  } else if (event.key in steps) {
    event.preventDefault();
    if (rateSnapping) {
      return;
    }
    const next = Math.max(0, rateValue + steps[event.key]);
    if (next >= RATE_WALL) {
      snapRateBack();
    } else {
      setRate(next);
    }
  }
});

// ---------- The contract ----------

const signName = document.querySelector("#signName");
const signBtn = document.querySelector("#signBtn");
const stamp = document.querySelector("#stamp");
let contractSigned = false;

signBtn.addEventListener("click", () => {
  if (contractSigned) {
    nextSlide();
    return;
  }

  if (!signName.value.trim()) {
    showToast("Type your name first. Initials do not count.");
    signName.focus();
    return;
  }

  contractSigned = true;
  signName.disabled = true;
  stamp.classList.add("show");
  signBtn.textContent = "See the final verdict";
  showToast("Signed. This is now legally binding (emotionally).");
});

signName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    signBtn.click();
  }
});

window.addEventListener("pointermove", watchPointer);
window.addEventListener("resize", resetNoButtons);
confettiBtn.addEventListener("click", launchConfetti);