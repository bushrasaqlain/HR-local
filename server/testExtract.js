    async function extractCV(rawText) {
  const prompt = `Extract structured data from this CV text. Return ONLY valid JSON matching this shape:
{"full_name": string|null, "email": string|null, "phone": string|null,
 "education": [{"degree": string, "institute": string, "start_year": string|null, "end_year": string|null, "ongoing": boolean}],
 "experience": [{"company": string, "designation": string, "start_date": string|null, "end_date": string|null, "ongoing": boolean}]}

If you are not confident about a field, return null instead of guessing.

CV TEXT:
${rawText}`;

  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1:8b",
      messages: [{ role: "user", content: prompt }],
      format: "json",
      stream: false,
    }),
  });

  const data = await response.json();
  try {
    return JSON.parse(data.message.content);
  } catch (e) {
    console.error("Failed to parse model output:", data.message.content);
    return null;
  }
}

(async () => {
  const sampleCV = `Kholla Qureshi
kholla.qureshi@email.com
0300-1234567

Education
BSc Computer Science, FAST University, 2018-2022

Experience
Software Engineer, Systems Ltd, Jan 2022 - Present`;

  console.log("Sending to Ollama, please wait...");
  const result = await extractCV(sampleCV);
  console.log(JSON.stringify(result, null, 2));
})();