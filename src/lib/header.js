export function setupMainHeaderNavigation() {
  document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".header ul li");
    const sections = document.querySelectorAll(".container");

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const targetId = item.getAttribute("data-target");

        // Hide all sections
        sections.forEach((section) => (section.style.display = "none"));
        // Show the selected section
        document.getElementById(targetId).style.display = "block";
        // Remove active class from all tabs
        navItems.forEach((nav) => nav.classList.remove("active"));

        // Add active class to the clicked tab
        item.classList.add("active");
      });
    });

    // Set default active tab on page load
    document.querySelector(".header li").classList.add("active");
    document.getElementById("sendContainer").style.display = "block";
  });
}

export function setupGroupHeaderNavigation() {
  document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".groupHeader ul li");
    const sections = document.querySelectorAll(".groupContainer");

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const targetId = item.getAttribute("data-target");

        // Hide all sections
        sections.forEach((section) => (section.style.display = "none"));

        // Show the selected section
        document.getElementById(targetId).style.display = "block";

        // Remove active class from all tabs
        navItems.forEach((nav) => nav.classList.remove("active"));

        // Add active class to the clicked tab
        item.classList.add("active");
      });
    });

    // Set default active tab on page load
    document.querySelector(".groupHeader li").classList.add("active");
    document.getElementById("createGroupContainer").style.display = "block";
  });
}

export function setupProHeaderNavigation() {
  document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".proHeader ul li");
    const sections = document.querySelectorAll(".proContainer");

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const targetId = item.getAttribute("data-target");

        // Hide all sections
        sections.forEach((section) => (section.style.display = "none"));

        // Show the selected section
        document.getElementById(targetId).style.display = "block";

        // Remove active class from all tabs
        navItems.forEach((nav) => nav.classList.remove("active"));

        // Add active class to the clicked tab
        item.classList.add("active");
      });
    });

    // Set default active tab on page load
    document.querySelector(".proHeader li").classList.add("active");
    document.getElementById("upload-image-container").style.display = "block";
  });
}
