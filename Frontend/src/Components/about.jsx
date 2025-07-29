const About = () => {
  return (
    <div className="bg-white dark:bg-gray-900">
      <section className="py-16 px-4 text-center max-w-3xl mx-auto">
        <h1 className="mb-6 text-5xl font-extrabold text-gray-900 dark:text-white">
          About VoyageVault
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Your all-in-one travel planner for stress-free group adventures.
        </p>
      </section>
      <section className="bg-gray-50 dark:bg-gray-800 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            What You Can Do
          </h2>
          <ul className="space-y-6 text-gray-700 dark:text-gray-300">
            {[
              "Build and share detailed itineraries",
              "Track expenses and split costs easily",
              "Upload and manage travel documents",
              "Chat with your group to coordinate plans",
            ].map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <svg
                  className="w-6 h-6 text-green-500 mt-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          Why VoyageVault?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Travel should be exciting — not overwhelming. VoyageVault keeps your trip
          organized, collaborative, and stress-free. Say goodbye to scattered messages,
          lost tickets, and forgotten plans.
        </p>
      </section>
    </div>
  );
};

export default About;
