' The themes and accents (components/lib/Theme.brs): the ones every app
' offers, in the colors packages/tv/test/fixtures/appearance.json gives the
' TVs (the runner gives it as pkg:/fixtures/appearance.json), each look
' with its words readable.

function themeTestFixture() as object
    data = ParseJson(ReadAsciiFile("pkg:/fixtures/appearance.json"))
    if data = invalid then tkFail("the fixture packages/tv/test/fixtures/appearance.json didn't load")
    return data
end function

' Every look: each theme shown with each accent.
function themeTestLooks() as object
    looks = []
    for each theme in ["dark", "light", "midnight", "obsidian", "arctic"]
        for each accent in themeAccents()
            looks.Push(theme + "/" + accent)
        end for
    end for
    return looks
end function

sub test_theme_offers_what_every_app_offers()
    data = themeTestFixture()
    tkEqual(themeIds(), data.themes)
    tkEqual(themeAccents(), data.accents)
    for each theme in data.themeAccents
        tkEqual(themeOwnAccent(theme), data.themeAccents[theme], theme + "'s own accent")
    end for
    tkEqual(themeShown(data.defaultTheme), "dark")
    tkEqual(themeShown("system"), data.systemWithoutSetting, "a Roku has no light or dark of its own")
end sub

sub test_theme_colors_are_the_fixtures()
    tv = themeTestFixture().palettes.tv
    palettes = themePalettes()
    for each theme in tv.themes
        tkEqual(palettes[theme], tv.themes[theme], theme)
    end for
    tkEqual(palettes.Count(), tv.themes.Count(), "no theme the fixture lacks")
    accents = themeAccentColors()
    for each accent in tv.accents
        tkEqual(accents[accent], tv.accents[accent], accent)
    end for
end sub

' WCAG's contrast between two colors (RRGGBB).
function themeTestContrast(a as string, b as string) as float
    la = themeTestLuminance(a)
    lb = themeTestLuminance(b)
    if la < lb
        swap = la
        la = lb
        lb = swap
    end if
    return (la + 0.05) / (lb + 0.05)
end function

function themeTestLuminance(color as string) as float
    weights = [0.2126, 0.7152, 0.0722]
    total = 0.0
    for i = 0 to 2
        c = themeTestHex(Mid(color, i * 2 + 1, 2)) / 255.0
        if c <= 0.04045
            c = c / 12.92
        else
            c = ((c + 0.055) / 1.055) ^ 2.4
        end if
        total = total + weights[i] * c
    end for
    return total
end function

function themeTestHex(digits as string) as integer
    value = 0
    for each digit in UCase(digits).Split("")
        value = value * 16 + Instr(1, "0123456789ABCDEF", digit) - 1
    end for
    return value
end function

sub test_theme_every_look_keeps_its_words_readable()
    pairs = themeTestFixture().contrast
    tkTrue(pairs.Count() > 10, "the fixture's pairs")
    tkTrue(Abs(themeTestContrast("000000", "FFFFFF") - 21) < 0.01, "black on white is 21:1")
    tkTrue(Abs(themeTestContrast("777777", "FFFFFF") - 4.48) < 0.01, "#777 on white is 4.48:1")
    for each look in themeTestLooks()
        palette = themePalette(look)
        for each pair in pairs
            ratio = themeTestContrast(palette[pair[0]], palette[pair[1]])
            if ratio < pair[2] then tkFail(look + ": " + pair[0] + " on " + pair[1] + " is " + Str(ratio).Trim() + ", under " + Str(pair[2]).Trim())
        end for
    end for
end sub

' The words on the accent are the background's, so a color written as one
' stands for both.
sub test_theme_words_on_the_accent_are_the_background()
    for each look in themeTestLooks()
        palette = themePalette(look)
        tkEqual(palette.onAccent, palette.bg, look)
    end for
end sub

sub test_theme_dark_with_sky_changes_nothing()
    tkEqual(themeTints("dark/sky").Count(), 0)
    tints = themeTints("dark/violet")
    tkEqual(tints["38BDF8"], "C18AFF", "the accent")
    tkEqual(tints["7DD3FC"], "D8B9FF")
    tkEqual(tints.Count(), 2, "and nothing else")
end sub

' A node tinted in a screen's own init and again with the screen (Colors.brs)
' keeps the colors of the first.
sub test_theme_tinting_twice_changes_nothing()
    for each look in themeTestLooks()
        tints = themeTints(look)
        for each written in tints
            once = tints[written]
            twice = tints[once]
            if twice <> invalid and twice <> once then tkFail(look + ": " + written + " is " + once + " once, " + twice + " twice")
        end for
    end for
end sub

sub test_theme_a_light_look_changes_every_color_but_the_accents_alpha()
    tints = themeTints("light/sky")
    tkEqual(tints["16191E"], "E6E8EC", "the background")
    tkInvalid(tints["0B0D10"], "what is on pictures stays dark")
    tkInvalid(tints["E9EBEF"], "under light words")
    tkEqual(tints["EBEBEB"], "17191D", "the words")
    tkEqual(tints["38BDF8"], "0369A1", "the accent, deep")
    tkEqual(tints["000000"], "E6E8EC", "a backdrop's scrim, light")
end sub

sub test_theme_shows_system_and_unknown_ones_as_dark()
    tkEqual(themeLook("system", ""), "dark/sky")
    tkEqual(themeLook("sepia", "mauve"), "dark/sky", "a later Pley's")
    tkEqual(themeLook(invalid, invalid), "dark/sky")
    tkEqual(themeLook("midnight", ""), "midnight/blue", "the theme's own accent")
    tkEqual(themeLook("Obsidian", "AMBER"), "obsidian/amber")
    tkEqual(themeParts("arctic/violet"), { theme: "arctic", accent: "violet" })
    tkEqual(themeParts("nonsense"), { theme: "dark", accent: "sky" })
end sub

sub test_theme_players_stay_dark_in_light()
    tkEqual(themePlayerLook("light/amber"), "dark/amber")
    tkEqual(themePlayerLook("midnight/blue"), "midnight/blue")
    tkTrue(themeIsLight("light/sky"))
    tkFalse(themeIsLight("arctic/teal"))
end sub

sub test_theme_is_the_accounts_where_the_server_keeps_one()
    kept = { keptTheme: "light", keptAccent: "teal" }
    facts = { accountHeard: true, accountTheme: "midnight", accountAccent: "" }
    facts.Append(kept)
    tkEqual(themeChosen(facts), { theme: "midnight", accent: "" }, "heard")
    facts.accountHeard = false
    tkEqual(themeChosen(facts), { theme: "light", accent: "teal" }, "until heard, the one kept")
    facts.accountHeard = true
    facts.accountTheme = ""
    tkEqual(themeChosen(facts), { theme: "light", accent: "teal" }, "an older Pley keeps none")
    tkEqual(themeChosen({ accountHeard: false, accountTheme: "", accountAccent: "", keptTheme: "", keptAccent: "" }), { theme: "dark", accent: "" }, "nothing kept yet")
end sub

sub test_theme_guide_pictures_follow_the_look()
    tkEqual(themeGuideImages("light/violet"), { focus: "pkg:/images/guide/focus-violet-light.9.png", cell: "pkg:/images/guide/cell-light.9.png", past: "pkg:/images/guide/past-light.9.png" })
    tkEqual(themeGuideImages("obsidian/emerald").focus, "pkg:/images/guide/focus-emerald-dark.9.png")
end sub
