export default function Loading() {
  return (
    <main
      className="flex-1 flex items-center justify-center"
      style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"
        />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </main>
  );
}
