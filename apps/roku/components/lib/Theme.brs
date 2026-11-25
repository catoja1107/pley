' The themes and accents every app offers (docs/API.md#appearance), in the
' Roku's colors: those of packages/tv/test/fixtures/appearance.json, which
' the tests hold them to. The screens are written in Dark's colors with
' sky, in their XML and their code; the scene works out what each of those
' becomes in the look shown (themeTints), and the screens tint with it
' (shared/Colors.brs). A look is a theme shown and an accent: "midnight/blue".

' The themes, as an account keeps them. System is Dark on a Roku, which
' has no light or dark of its own.
function themeIds() as object
    return ["system", "dark", "light", "midnight", "obsidian", "arctic"]
end function

function themeAccents() as object
    return ["sky", "blue", "emerald", "teal", "amber", "violet"]
end function

' The theme a Roku shows for a choice: System, and a theme it doesn't know
' (a later Pley's), are Dark.
function themeShown(theme as dynamic) as string
    name = LCase(httpString(theme))
    for each known in ["dark", "light", "midnight", "obsidian", "arctic"]
        if name = known then return known
    end for
    return "dark"
end function

' Each theme's own accent, shown while the account picked none.
function themeOwnAccent(theme as string) as string
    own = { dark: "sky", light: "sky", midnight: "blue", obsidian: "emerald", arctic: "teal" }
    found = own[themeShown(theme)]
    if found = invalid then return "sky"
    return found
end function

' The accent shown over a theme: the one chosen, else the theme's own (for
' none, or one the Roku doesn't know).
function themeAccentShown(theme as dynamic, accent as dynamic) as string
    name = LCase(httpString(accent))
    for each known in themeAccents()
        if name = known then return known
    end for
    return themeOwnAccent(themeShown(theme))
end function

' The look a choice shows: "midnight/blue".
function themeLook(theme as dynamic, accent as dynamic) as string
    return themeShown(theme) + "/" + themeAccentShown(theme, accent)
end function

' A look's { theme, accent }; Dark with sky for one not well made.
function themeParts(look as string) as object
    parts = look.Split("/")
    if parts.Count() <> 2 then return { theme: "dark", accent: "sky" }
    theme = themeShown(parts[0])
    return { theme: theme, accent: themeAccentShown(theme, parts[1]) }
end function

' Whether a look draws dark words on light backgrounds.
function themeIsLight(look as string) as boolean
    return themeParts(look).theme = "light"
end function

' The players' look: the one shown, but Dark in the Light theme, as the
' picture under them needs, with the same accent.
function themePlayerLook(look as string) as string
    parts = themeParts(look)
    if parts.theme = "light" then return "dark/" + parts.accent
    return parts.theme + "/" + parts.accent
end function

' What the theme is: the account's once it is heard on a server that keeps
' one, else the one kept on this Roku (the last shown, or the one picked
' here on an older Pley). facts: { accountHeard, accountTheme ("" on a
' server that keeps none), accountAccent ("" for the theme's own),
' keptTheme, keptAccent }. Gives { theme, accent } as chosen, "" for the
' theme's own accent.
function themeChosen(facts as object) as object
    if facts.accountHeard = true and httpString(facts.accountTheme) <> ""
        return { theme: httpString(facts.accountTheme), accent: httpString(facts.accountAccent) }
    end if
    theme = httpString(facts.keptTheme)
    if theme = "" then theme = "dark"
    return { theme: theme, accent: httpString(facts.keptAccent) }
end function

' The themes' colors (RRGGBB), as the fixture has them.
function themePalettes() as object
    semantic = { danger: "EB6B70", success: "3FB27F", warning: "E8B04B", info: "4C9AFF", scrim: "000000" }
    dark = { bg: "16191E", surface: "1E222A", surface2: "262B35", surface3: "2E3440", fg: "EBEBEB", muted: "A1A9B6", subtle: "8B95A5", edge: "6C7584", faint: "4B5261" }
    midnight = { bg: "101522", surface: "171F30", surface2: "202B40", surface3: "2B3954", fg: "EBEBEB", muted: "AAB5C8", subtle: "8D9AB2", edge: "5E6F90", faint: "3D4B68" }
    obsidian = { bg: "101311", surface: "171E19", surface2: "1F2822", surface3: "2A3630", fg: "EBEBEB", muted: "A8B4AA", subtle: "8C9A8F", edge: "607166", faint: "3F4D44" }
    arctic = { bg: "101419", surface: "131F26", surface2: "1A2A33", surface3: "24363F", fg: "EBEBEB", muted: "9AB0B9", subtle: "819AA4", edge: "56717C", faint: "384B53" }
    for each theme in [dark, midnight, obsidian, arctic]
        theme.Append(semantic)
    end for
    light = { bg: "E6E8EC", surface: "EEF0F3", surface2: "DCE0E6", surface3: "CDD3DC", fg: "17191D", muted: "4A5262", subtle: "586170", edge: "767F8D", faint: "ACB3BE", danger: "B4262F", success: "15704A", warning: "875700", info: "1F5CC8", scrim: "E6E8EC" }
    return { dark: dark, light: light, midnight: midnight, obsidian: obsidian, arctic: arctic }
end function

' The accents' colors: on the dark themes bright, with dark words on them;
' on Light deep, with light words.
function themeAccentColors() as object
    return {
        sky: { dark: { accent: "38BDF8", accentBright: "7DD3FC" }, light: { accent: "0369A1", accentBright: "075985" } },
        blue: { dark: { accent: "70A5FF", accentBright: "A9C8FF" }, light: { accent: "2458C8", accentBright: "1D47A6" } },
        emerald: { dark: { accent: "4CCB83", accentBright: "8BE3B1" }, light: { accent: "1F6B44", accentBright: "1D5A3A" } },
        teal: { dark: { accent: "48E0E5", accentBright: "8DEFF1" }, light: { accent: "006A71", accentBright: "005A60" } },
        amber: { dark: { accent: "F2B65F", accentBright: "F8D08F" }, light: { accent: "8A4F0C", accentBright: "74420A" } },
        violet: { dark: { accent: "C18AFF", accentBright: "D8B9FF" }, light: { accent: "6E3FD0", accentBright: "5A2FB0" } }
    }
end function

' A look's colors by name (RRGGBB): the theme's, its accent's, and the
' words on the accent, which are the background's in every theme.
function themePalette(look as string) as object
    parts = themeParts(look)
    palette = themePalettes()[parts.theme]
    mode = "dark"
    if parts.theme = "light" then mode = "light"
    palette.Append(themeAccentColors()[parts.accent][mode])
    palette.onAccent = palette.bg
    return palette
end function

' The colors the screens are written in (Dark's with sky), by the name
' each stands for: the XML's and the code's. onAccent is written as bg,
' which it is in every theme, and the ready-to-watch card's as surface.
' Android's own black and white (0B0D10, E9EBEF) are none of them: what is
' drawn on pictures in them (a tile's quality badges, the skip button)
' stays dark under light words in every look, as the other apps draw it.
function themeWritten() as object
    return {
        bg: ["16191E"], surface: ["1E222A", "191D24"], surface2: ["262B35"], surface3: ["2E3440"],
        fg: ["EBEBEB"], muted: ["A1A9B6"], subtle: ["8B95A5"], edge: ["6C7584"], faint: ["4B5261"],
        danger: ["EB6B70"], success: ["3FB27F"], warning: ["E8B04B"], info: ["4C9AFF"], scrim: ["000000"],
        accent: ["38BDF8"], accentBright: ["7DD3FC"]
    }
end function

' What each color written becomes in a look ({ "16191E": "101522" }), for
' those the look changes: none for Dark with sky. Its alpha stays the
' one written.
function themeTints(look as string) as object
    palette = themePalette(look)
    dark = themePalette("dark/sky")
    tints = {}
    written = themeWritten()
    for each name in written
        if palette[name] <> dark[name]
            for each color in written[name]
                tints[color] = palette[name]
            end for
        end if
    end for
    return tints
end function

' Live TV's guide draws on pictures, not colors (TimeGrid has no tint):
' the look's ones (scripts/make_images.py makes every theme's and
' accent's).
function themeGuideImages(look as string) as object
    parts = themeParts(look)
    mode = "dark"
    if parts.theme = "light" then mode = "light"
    folder = "pkg:/images/guide/"
    return {
        focus: folder + "focus-" + parts.accent + "-" + mode + ".9.png",
        cell: folder + "cell-" + parts.theme + ".9.png",
        past: folder + "past-" + parts.theme + ".9.png"
    }
end function
