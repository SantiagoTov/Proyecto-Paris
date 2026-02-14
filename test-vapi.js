
const VAPI_API_KEY = "a8f95863-0885-4d3b-9060-de7af720b787";
const PHONE_NUMBER_ID = "657b8ef9-061c-4a64-b375-4711aef12aa3";

async function testCall() {
    console.log("Testeando Vapi Call...");

    try {
        const response = await fetch("https://api.vapi.ai/call", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phoneNumberId: PHONE_NUMBER_ID,
                customer: { number: "+573176664977" }, // Tu número
                assistant: {
                    firstMessage: "Hola, esta es una prueba de sistema.",
                    model: {
                        provider: "openai",
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "system", content: "Eres un asistente de prueba." }]
                    },
                    voice: {
                        provider: "11labs",
                        voiceId: "b2htR0pMe28pYwCY9gnP"
                    }
                }
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error de red:", e);
    }
}

testCall();
