// Pretty print JSON
export function ppj(message: string, object: any) {
  console.log(message, JSON.stringify(object, null, 2));
}

// https://stackoverflow.com/a/64346570
export function downloadJsonFile(filename: string, object: any) {
  const blob = new Blob([JSON.stringify(object)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  a.remove();
}
