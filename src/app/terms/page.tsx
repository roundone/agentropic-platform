export const metadata = {
  title: "Terms of Service - Agentropic",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: February 14, 2026
      </p>

      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p className="mt-2">
            By accessing or using Agentropic (&quot;the Service&quot;), you
            agree to be bound by these Terms of Service. If you do not agree,
            please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            2. Description of Service
          </h2>
          <p className="mt-2">
            Agentropic provides browser-based access to open-source AI agent
            projects in isolated, containerized environments. Sessions are
            temporary and may be terminated at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. User Accounts
          </h2>
          <p className="mt-2">
            You are responsible for maintaining the security of your account
            credentials. You must not share your account or use the Service for
            any unlawful purpose.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. Acceptable Use
          </h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Use the Service for illegal activities</li>
            <li>Attempt to gain unauthorized access to other users&apos; sessions</li>
            <li>Use the Service to mine cryptocurrency or run long-running compute tasks unrelated to the hosted projects</li>
            <li>Abuse API budgets or attempt to circumvent usage limits</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. Limitations
          </h2>
          <p className="mt-2">
            The Service is provided &quot;as is&quot; without warranties of any
            kind. Sessions may be terminated without notice. We are not
            responsible for data loss within sessions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            6. Changes to Terms
          </h2>
          <p className="mt-2">
            We may update these terms from time to time. Continued use of the
            Service after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            Questions about these terms? Email us at{" "}
            <a
              href="mailto:support@agentropic.dev"
              className="text-primary underline underline-offset-4"
            >
              support@agentropic.dev
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
