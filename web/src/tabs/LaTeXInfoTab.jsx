export default function LaTeXInfoTab({ onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid #4b5563',
          background: '#1f2937',
          color: '#e5e7eb',
          fontSize: '0.9rem',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        ← Back
      </button>

      <h2>About LaTeX Mode</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
          <h3 style={{ marginTop: 0 }}>What is LaTeX?</h3>
          <p style={{ fontSize: "0.9rem", color: "#e5e7eb", lineHeight: "1.6" }}>
            LaTeX is a professional document preparation system widely used in academia and technical fields.
            It produces beautifully formatted documents with precise typographic control, making it ideal for resumes
            that need to stand out with clean, professional formatting.
          </p>
        </div>

        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
          <h3 style={{ marginTop: 0 }}>Why use LaTeX for resumes?</h3>
          <ul style={{ fontSize: "0.9rem", color: "#e5e7eb", lineHeight: "1.6", paddingLeft: "20px" }}>
            <li>Professional, consistent formatting across all platforms</li>
            <li>Precise control over spacing, margins, and layout</li>
            <li>ATS-friendly when compiled to PDF</li>
            <li>Version control friendly (plain text format)</li>
            <li>Highly customizable templates</li>
          </ul>
        </div>

        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
          <h3 style={{ marginTop: 0 }}>How LaTeX mode works</h3>
          <p style={{ fontSize: "0.9rem", color: "#e5e7eb", lineHeight: "1.6", marginBottom: "12px" }}>
            When you enable LaTeX mode in the Resume Checker:
          </p>
          <ol style={{ fontSize: "0.9rem", color: "#e5e7eb", lineHeight: "1.6", paddingLeft: "20px" }}>
            <li>Paste your LaTeX resume code into the text area</li>
            <li>Run the resume checker to get feedback</li>
            <li>Click "Generate Improved LaTeX Resume" to get an updated version based on the feedback</li>
            <li>Copy the improved LaTeX code and compile it to PDF</li>
          </ol>
        </div>

        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#020617", border: "1px solid #3b82f6" }}>
          <h3 style={{ marginTop: 0, color: "#3b82f6" }}>Getting started with LaTeX</h3>
          <p style={{ fontSize: "0.9rem", color: "#e5e7eb", lineHeight: "1.6", marginBottom: "12px" }}>
            If you don't have a LaTeX resume yet, here are some resources:
          </p>
          <ul style={{ fontSize: "0.9rem", color: "#e5e7eb", lineHeight: "1.6", paddingLeft: "20px" }}>
            <li>
              <a
                href="https://www.overleaf.com/gallery/tagged/cv"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#3b82f6", textDecoration: "none" }}
              >
                Overleaf Resume Templates
              </a> - Free online LaTeX editor with resume templates
            </li>
            <li>
              <a
                href="https://www.overleaf.com/latex/templates"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#3b82f6", textDecoration: "none" }}
              >
                LaTeX Resume Templates
              </a> - Browse hundreds of professional templates
            </li>
            <li>
              <a
                href="https://github.com/sb2nov/resume"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#3b82f6", textDecoration: "none" }}
              >
                Jake's Resume Template
              </a> - Popular single-column resume template
            </li>
          </ul>
        </div>

        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
          <h3 style={{ marginTop: 0 }}>Important notes</h3>
          <ul style={{ fontSize: "0.9rem", color: "#e5e7eb", lineHeight: "1.6", paddingLeft: "20px" }}>
            <li>The AI-generated improvements are based on your resume's feedback only</li>
            <li>Always review the generated LaTeX code before compiling</li>
            <li>LaTeX code is analyzed as plain text - formatting-specific issues may not be detected</li>
            <li>Compile the final LaTeX to PDF using Overleaf, pdflatex, or XeLaTeX</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
