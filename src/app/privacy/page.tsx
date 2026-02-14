export const metadata = {
  title: "Privacy Policy - Agentropic",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: February 14, 2026
      </p>

      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            1. Information We Collect
          </h2>
          <p className="mt-2">When you use Agentropic, we collect:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Account information:</strong> Email address, name, and
              profile image provided during sign-up (via Clerk)
            </li>
            <li>
              <strong>Usage data:</strong> Session history, projects accessed,
              and API usage metrics
            </li>
            <li>
              <strong>Technical data:</strong> Browser type, IP address, and
              device information for security and analytics
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            2. How We Use Your Information
          </h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>To provide and maintain the Service</li>
            <li>To enforce usage limits and prevent abuse</li>
            <li>To improve the Service and user experience</li>
            <li>To communicate important updates about your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            3. Data Storage
          </h2>
          <p className="mt-2">
            Your account data is stored securely using Neon (PostgreSQL). Session
            containers are ephemeral and isolated. We do not persist data created
            within your sessions beyond the session lifecycle.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            4. Third-Party Services
          </h2>
          <p className="mt-2">We use the following third-party services:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>
              <strong>Clerk</strong> &mdash; Authentication and user management
            </li>
            <li>
              <strong>Fly.io</strong> &mdash; Container hosting for sessions
            </li>
            <li>
              <strong>Vercel</strong> &mdash; Web application hosting
            </li>
            <li>
              <strong>Neon</strong> &mdash; Database hosting
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            5. Data Deletion
          </h2>
          <p className="mt-2">
            You can request deletion of your account and associated data by
            contacting us. Session data is automatically cleaned up when sessions
            end.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            6. Cookies
          </h2>
          <p className="mt-2">
            We use cookies for authentication (Clerk session cookies) and
            session routing (fly.io machine binding). We do not use third-party
            tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            Privacy questions? Email us at{" "}
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
