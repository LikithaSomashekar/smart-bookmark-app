"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [bookmarks, setBookmarks] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user
      setUser(currentUser)
      if (currentUser) fetchBookmarks()
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) fetchBookmarks()
        else setBookmarks([])
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) setBookmarks(data)
  }

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id)
    fetchBookmarks()
  }

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // ================= LOGIN PAGE =================
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="bg-gray-900 border border-gray-800 p-10 rounded-2xl shadow-2xl text-center">
          <h1 className="text-2xl font-semibold text-white mb-6">
            Smart Bookmark
          </h1>
          <button
            onClick={signIn}
            className="bg-indigo-600 hover:bg-indigo-700 transition px-6 py-3 rounded-lg text-white font-medium"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  // ================= DASHBOARD =================
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* Navbar */}
      <header className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold tracking-wide">
          Smart Bookmark
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">

        {/* Add Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Add New Bookmark
          </h2>
          <AddBookmark user={user} refresh={fetchBookmarks} />
        </div>

        {/* Bookmark List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Your Bookmarks
          </h2>

          {bookmarks.length === 0 && (
            <p className="text-gray-500">
              No bookmarks added yet.
            </p>
          )}

          <div className="grid gap-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-md hover:border-indigo-500 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">
                      {bookmark.title}
                    </p>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 text-sm hover:underline"
                    >
                      {bookmark.url}
                    </a>
                  </div>

                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}

function AddBookmark({
  user,
  refresh,
}: {
  user: any
  refresh: () => void
}) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")

  const addBookmark = async () => {
    if (!title || !url) return

    await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: user.id,
      },
    ])

    setTitle("")
    setUrl("")
    refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Bookmark Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-gray-800 border border-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <input
        type="text"
        placeholder="Bookmark URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="bg-gray-800 border border-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        onClick={addBookmark}
        className="bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg transition font-medium"
      >
        Add Bookmark
      </button>
    </div>
  )
}
