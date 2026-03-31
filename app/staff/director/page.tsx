export default function DirectorDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Director Dashboard — coming soon
        </h1>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
