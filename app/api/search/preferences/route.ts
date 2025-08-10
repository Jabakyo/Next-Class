import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const SEARCH_PREFS_FILE = path.join(process.cwd(), 'data', 'search-preferences.json')

interface SearchPreferences {
  [userId: string]: {
    recentSearches: string[]
    savedFilters: {
      [name: string]: {
        searchTerm: string
        selectedClass: string
        selectedTimeSlot: string
        selectedSubject: string
        verificationFilter: string
        createdAt: string
      }
    }
    lastSearchParams: {
      searchTerm: string
      selectedClass: string
      selectedTimeSlot: string
      selectedSubject: string
      verificationFilter: string
    }
  }
}

// Ensure search preferences file exists
function ensureSearchPrefsFile() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(SEARCH_PREFS_FILE)) {
    fs.writeFileSync(SEARCH_PREFS_FILE, JSON.stringify({}))
  }
}

function getSearchPreferences(): SearchPreferences {
  ensureSearchPrefsFile()
  const data = fs.readFileSync(SEARCH_PREFS_FILE, 'utf8')
  return JSON.parse(data)
}

function saveSearchPreferences(prefs: SearchPreferences) {
  ensureSearchPrefsFile()
  fs.writeFileSync(SEARCH_PREFS_FILE, JSON.stringify(prefs, null, 2))
}

// GET /api/search/preferences - Get user search preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchPrefs = getSearchPreferences()
    const userPrefs = searchPrefs[user.id] || {
      recentSearches: [],
      savedFilters: {},
      lastSearchParams: {
        searchTerm: '',
        selectedClass: 'All',
        selectedTimeSlot: 'All',
        selectedSubject: 'All',
        verificationFilter: 'All'
      }
    }

    return NextResponse.json({
      success: true,
      preferences: userPrefs
    })
  } catch (error) {
    console.error('Error fetching search preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch search preferences' }, { status: 500 })
  }
}

// POST /api/search/preferences - Save search preferences
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, data } = await request.json()
    const searchPrefs = getSearchPreferences()

    if (!searchPrefs[user.id]) {
      searchPrefs[user.id] = {
        recentSearches: [],
        savedFilters: {},
        lastSearchParams: {
          searchTerm: '',
          selectedClass: 'All',
          selectedTimeSlot: 'All',
          selectedSubject: 'All',
          verificationFilter: 'All'
        }
      }
    }

    const userPrefs = searchPrefs[user.id]

    switch (type) {
      case 'recentSearch':
        // Add to recent searches
        const searchTerm = data.searchTerm
        if (searchTerm && searchTerm.trim()) {
          userPrefs.recentSearches = [
            searchTerm,
            ...userPrefs.recentSearches.filter(s => s !== searchTerm)
          ].slice(0, 10) // Keep only last 10 searches
        }
        break

      case 'lastSearchParams':
        // Save last search parameters
        userPrefs.lastSearchParams = {
          searchTerm: data.searchTerm || '',
          selectedClass: data.selectedClass || 'All',
          selectedTimeSlot: data.selectedTimeSlot || 'All',
          selectedSubject: data.selectedSubject || 'All',
          verificationFilter: data.verificationFilter || 'All'
        }
        break

      case 'savedFilter':
        // Save named filter
        const filterName = data.name
        if (filterName) {
          userPrefs.savedFilters[filterName] = {
            searchTerm: data.searchTerm || '',
            selectedClass: data.selectedClass || 'All',
            selectedTimeSlot: data.selectedTimeSlot || 'All',
            selectedSubject: data.selectedSubject || 'All',
            verificationFilter: data.verificationFilter || 'All',
            createdAt: new Date().toISOString()
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid preference type' }, { status: 400 })
    }

    saveSearchPreferences(searchPrefs)

    return NextResponse.json({
      success: true,
      message: 'Search preferences saved',
      preferences: userPrefs
    })
  } catch (error) {
    console.error('Error saving search preferences:', error)
    return NextResponse.json({ error: 'Failed to save search preferences' }, { status: 500 })
  }
}

// DELETE /api/search/preferences - Delete search preferences
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const name = searchParams.get('name')

    const searchPrefs = getSearchPreferences()
    
    if (!searchPrefs[user.id]) {
      return NextResponse.json({ error: 'No preferences found' }, { status: 404 })
    }

    const userPrefs = searchPrefs[user.id]

    switch (type) {
      case 'recentSearches':
        userPrefs.recentSearches = []
        break

      case 'savedFilter':
        if (name && userPrefs.savedFilters[name]) {
          delete userPrefs.savedFilters[name]
        } else {
          return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
        }
        break

      case 'all':
        delete searchPrefs[user.id]
        break

      default:
        return NextResponse.json({ error: 'Invalid deletion type' }, { status: 400 })
    }

    saveSearchPreferences(searchPrefs)

    return NextResponse.json({
      success: true,
      message: 'Search preferences deleted'
    })
  } catch (error) {
    console.error('Error deleting search preferences:', error)
    return NextResponse.json({ error: 'Failed to delete search preferences' }, { status: 500 })
  }
}