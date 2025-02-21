export function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
  
      // Read the first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
  
      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet);
  
      // Pakistani number regex
      const pakistaniNumberRegex = /^(?:\+92|0[3-9])\d{9}$/;
  
      // Extract numbers
      const numbers = jsonData
        .map((row) => {
          for (let key in row) {
            if (
              typeof row[key] === "string" &&
              row[key].match(pakistaniNumberRegex)
            ) {
              return row[key].trim();
            }
          }
          return null;
        })
        .filter(Boolean); // Remove null values
  
      console.log("Pakistani Numbers:", numbers);
      alert("Pakistani Numbers: " + numbers.join(", "));
    };
  
    reader.readAsArrayBuffer(file);
  }
  