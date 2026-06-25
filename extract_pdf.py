import fitz

pdf_path = "Test-bank-CF.pdf"

doc = fitz.open(pdf_path)

all_text = []

for page in doc:
    all_text.append(page.get_text())

full_text = "\n".join(all_text)

with open("full_text.txt", "w", encoding="utf-8") as f:
    f.write(full_text)

print("Done!")
print("Pages:", len(doc))
print("Text saved to full_text.txt")