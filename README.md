# Nit Flow Manager

Build the FINAL production-ready frontend for my Waku-powered NiT generation application.

The frontend will be directly merged into my existing project, so write clean, modular, production-ready code. Do NOT create demo data, mock responses, fake questions, or placeholder API responses.

## FLOW

### 1. Initial Q&A Screen

The application initially shows only a clean ChatGPT-style Q&A interface.

- White background.
- Centered start area with a prompt/input box.
- User starts naturally, e.g. "Hi", "Make a NiT", etc.
- Waku then drives the complete Q&A workflow.
- Keep the interface focused entirely on the current question and answer.
- Do not show the NiT document or AI-edit chatbot during this stage.

The backend will dynamically provide the questions. The frontend must render them according to their JSON structure.

### 2. Dynamic Backend Question UI

Every question received from the backend must be rendered dynamically.

Possible JSON shapes:

ask_options:
Free-form clarification

{
  "question": str,
  "options": [str]
}

ask_field:
One wizard question

{
  "key": str,
  "question": str,
  "type": "text"|"dropdown"|"radio"|"email"|"mobile"|"number"|"file",
  "options": [str],
  "mandatory": bool
}
Every possible "question" shape, as JSON, both endpoints

Event/keyWhenShapeask_optionsFree-form clarification{ "question": str, "options": [str] }ask_fieldOne wizard question{ "key": str, "question": str, "type": "text"|"dropdown"|"radio"|"email"|"mobile"|"number"|"file", "options": [str], "mandatory": bool }flow_completeWizard finished{ "flow": str, "answers": {...}, "actions": ["Generate NIT","Edit Information","Cancel"] }nit_updatedDocument changed{ "session_id": str, "fields": {...}, "annexure_items": [...] }


The frontend must support these field types:

- text
- dropdown
- radio
- email
- mobile
- number
- file

Also handle:
- mandatory/optional states
- dynamic options
- validation
- file upload
- loading/processing states
- confirmation/editing of extracted information
- backend errors

Do NOT hardcode any questions, options, procurement logic, validation rules, or workflow conditions.

The backend controls what question is asked and what UI type/options are required.

### 3. File Upload

The user will upload documents during the Q&A flow.

The frontend must support backend-requested file uploads and display:

- filename
- file type
- file size
- upload progress
- processing state
- verification state
- remove/replace action

Do not implement document verification or extraction logic in the frontend. Only display the information/status returned by Waku.

### 4. Flow Completion

When the backend sends:

flow_complete

{
  "flow": str,
  "answers": {...},
  "actions": ["Generate NIT","Edit Information","Cancel"]
}

Display the collected information clearly and provide the actions returned by the backend.

Do not hardcode these actions; render the actions from the backend response.

### 5. NiT Generation

After the user selects Generate NIT:

- Generate the NiT through the Waku backend.
- Transition to a professional NiT document view.
- The document becomes the primary interface.
- Show the generated content cleanly and professionally.
- Provide appropriate document controls such as download/edit where supported.

There should be NO demo NiT content.

### 6. Edit and AI Edit

After NiT generation, provide two primary actions:

[ Edit ] [ AI Edit ]

Edit:
- Allow direct editing of the generated NiT.

AI Edit:
- Open a Waku chatbot on the right side.
- Chatbot width: approximately 25% of the screen.
- NiT document remains visible on the remaining 75%.

The chatbot allows natural-language modifications to the generated NiT.

When the backend sends:

nit_updated

{
  "session_id": str,
  "fields": {...},
  "annexure_items": [...]
}

Update the NiT UI using the returned data.

Do not hardcode the document structure. Render backend-generated data dynamically.

## VISUAL DESIGN

Use the same visual style and blue/white color combination from the provided reference image.

- White background
- Professional royal blue
- Light blue accents
- Dark navy text
- Subtle blue gradients
- Soft shadows
- Thin borders
- Rounded corners
- Clean typography
- Generous whitespace
- Premium enterprise aesthetic

Keep it extremely simple, polished, modern, and professional.

Avoid:
- unnecessary dashboard widgets
- charts
- excessive animations
- neon colors
- dark mode
- clutter
- generic AI-dashboard styling

## CHATBOT

Only show the chatbot after the user clicks "AI Edit".

- Right-side panel: 25%
- NiT document: 75%
- Clean professional chat UI
- User messages: blue/white
- Waku messages: white/light-blue with blue accents
- Support file attachments
- Show loading and processing states
- Render backend responses naturally

## API CONFIG

Create:

src/config.ts

Export API_BASE using:

const API_BASE = import.meta.env.VITE_API_BASE || "";

Add directly above it:

// Paste your Waku backend URL here

This must be the ONLY place API_BASE is referenced from. Every fetch call must import API_BASE from this file.

No API key or Authorization header is needed.

## FINAL REQUIREMENT

Create the actual final frontend that can be directly merged into my project.

Do not use mock/demo data.

Do not hardcode the procurement questions.

Do not hardcode backend responses.

Do not create fake API endpoints.

Build the UI and API integration around the JSON response shapes above so the frontend dynamically represents whatever Waku sends.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bc35f000-13ed-458b-8bc9-6a849ee62635).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
