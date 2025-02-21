// Function to create a new WhatsApp group
export function createGroup() {
    const numbersInput = document.getElementById("Groupnumbers").value.trim();
    const groupName = document.getElementById("groupName").value.trim();
    const numbersError = document.getElementById("numbersError");
    const groupError = document.getElementById("groupError");
  
    console.log(numbersInput, groupName);
  
    // Reset error messages
    numbersError.style.display = "none";
    groupError.style.display = "none";
  
    // Validate group name
    if (groupName === "") {
      groupError.style.display = "block";
      return;
    }
  
    // Validate numbers (supporting country codes +92 etc.)
    const numberArray = numbersInput
      .split(/[\s,]+/) // Split on spaces and commas
      .map((num) => num.trim()) // Trim each number
      .filter((num) => num.match(/^(\+?\d{10,15})$/)); // Allow +92 or just digits (10-15 long)
  
    if (numberArray.length === 0) {
      numbersError.style.display = "block";
      return;
    }
  
    // Prepare group object
    const groupData = { name: groupName, numbers: numberArray };
  
    // Get existing groups from localStorage
    let storedGroups = JSON.parse(localStorage.getItem("whatsappGroups")) || [];
  
    // Add new group
    storedGroups.push(groupData);
  
    // Save back to localStorage
    localStorage.setItem("whatsappGroups", JSON.stringify(storedGroups));
  
    // Confirmation
    alert(`Group "${groupName}" created successfully with ${numberArray.length} contacts.`);
  
    // Clear inputs
    document.getElementById("Groupnumbers").value = "";
    document.getElementById("groupName").value = "";
  }
  
  // Function to get numbers by group name
  export function getNumbersByGroup(groupName) {
    const storedGroups = JSON.parse(localStorage.getItem("whatsappGroups")) || [];
  
    const group = storedGroups.find((group) => group.name === groupName);
    return group ? group.numbers : [];
  }
  
  // Function to save group and numbers to localStorage
  export function saveGroupToLocalStorage(groupName, numbers) {
    if (!groupName || numbers.length === 0) {
      alert("Please enter a valid group name and numbers.");
      return;
    }
  
    let storedGroups = JSON.parse(localStorage.getItem("whatsappGroups")) || [];
  
    // Check if group exists, update it instead of adding duplicate
    const existingGroupIndex = storedGroups.findIndex((group) => group.name === groupName);
    if (existingGroupIndex !== -1) {
      storedGroups[existingGroupIndex].numbers = numbers;
    } else {
      storedGroups.push({ name: groupName, numbers: numbers });
    }
  
    localStorage.setItem("whatsappGroups", JSON.stringify(storedGroups));
    updateGroupDropdown();
    alert(`Group "${groupName}" saved!`);
  }
  
  // Function to update the group dropdown
  export function updateGroupDropdown() {
    const groupDropdown = document.getElementById("groupDropdown");
    groupDropdown.innerHTML = "<option value=''>Select a group</option>";
  
    let storedGroups = JSON.parse(localStorage.getItem("whatsappGroups")) || [];
    storedGroups.forEach((group) => {
      let option = document.createElement("option");
      option.value = group.name;
      option.textContent = group.name;
      groupDropdown.appendChild(option);
    });
  }
  
  // Function to insert numbers from a selected group into a textarea
  export function insertNumbersFromGroup() {
    const selectedGroupName = document.getElementById("groupDropdown").value;
    const selectedNumbersTextarea = document.getElementById("selectedNumbers");
  
    if (selectedGroupName) {
      let storedGroups = JSON.parse(localStorage.getItem("whatsappGroups")) || [];
      const group = storedGroups.find((group) => group.name === selectedGroupName);
  
      if (group) {
        selectedNumbersTextarea.value = group.numbers.join(", ");
      } else {
        selectedNumbersTextarea.value = "";
      }
    } else {
      selectedNumbersTextarea.value = "";
    }
  }
  