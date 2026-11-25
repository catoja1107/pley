' The app's colors, in the look shown (lib/Theme.brs). Screens and items
' are written in Dark's colors with sky (Android's, kept within Roku's
' broadcast-safe range), in their XML and their code: each color goes
' through uiTint, and a node with what it holds through uiRecolor, which
' give the look's. The scene puts what each color becomes in m.global
' (tints, and playerTints for the players), and makes the screens again
' when the look changes.

' The app's colors by name, in the look shown.
function uiColors() as object
    colors = {
        bg: "0x16191EFF",
        surface: "0x1E222AFF",
        surface2: "0x262B35FF",
        surface3: "0x2E3440FF",
        fg: "0xEBEBEBFF",
        muted: "0xA1A9B6FF",
        subtle: "0x8B95A5FF",
        accent: "0x38BDF8FF",
        accentBright: "0x7DD3FCFF",
        onAccent: "0x16191EFF",
        danger: "0xEB6B70FF",
        success: "0x3FB27FFF"
    }
    for each name in colors
        colors[name] = uiTint(colors[name])
    end for
    return colors
end function

' Dialogs and keyboards in the app's colors: the Scene's palette.
function uiPalette() as object
    colors = uiColors()
    palette = CreateObject("roSGNode", "RSGPalette")
    palette.colors = {
        DialogBackgroundColor: colors.surface,
        DialogItemColor: colors.fg,
        DialogTextColor: colors.fg,
        DialogFocusColor: colors.accent,
        DialogFocusItemColor: colors.onAccent,
        DialogSecondaryTextColor: colors.muted,
        DialogSecondaryItemColor: colors.muted,
        DialogInputFieldColor: colors.surface3,
        DialogKeyboardColor: colors.surface2,
        DialogFootprintColor: colors.surface3
    }
    return palette
end function

' A color written in Dark's ("0x16191ECC") in the look shown, its alpha
' kept; in a player, the players' (uiOnPlayer).
function uiTint(color as string) as string
    tints = uiTints()
    if tints.Count() = 0 or Len(color) <> 10 then return color
    shown = tints[Mid(color, 3, 6)]
    if shown = invalid then return color
    return "0x" + shown + Right(color, 2)
end function

' What the colors written become here: the screens' or the players'.
' Read once a component: the scene makes the screens again for another
' look. The scene's own children are made before it says (it tints them).
function uiTints() as object
    if m.uiTintSets = invalid
        if m.global = invalid or not m.global.hasField("tints") then return {}
        m.uiTintSets = { screens: m.global.tints, players: m.global.playerTints }
    end if
    if uiOnPlayer() then return m.uiTintSets.players
    return m.uiTintSets.screens
end function

' Whether this component draws as the players do: one of theirs (m.uiDark),
' one a player's markup marks (its dark field), or an item of a list a
' player filled (uiOnPlayerContent).
function uiOnPlayer() as boolean
    if m.uiDark = true then return true
    return m.top <> invalid and m.top.hasField("dark") and m.top.dark = true
end function

' Marks a list's content as a player's: its items draw as the player does.
sub uiPlayerContent(content as object)
    if content <> invalid and not content.hasField("dark") then content.addFields({ dark: true })
end sub

' Whether a list item's content (entry) is of a list a player filled.
function uiOnPlayerContent(entry as object) as boolean
    if entry = invalid then return false
    root = entry.getParent()
    return root <> invalid and root.hasField("dark") and root.dark = true
end function

' A list item that may be a player's takes its colors with its first
' content (entry), which says whose list it is in.
sub uiRecolorFor(entry as object)
    if m.uiRecolored = true then return
    m.uiRecolored = true
    m.uiDark = uiOnPlayerContent(entry)
    uiRecolor(m.top)
end sub

' Gives node, and what it holds, the look's colors in place of the ones
' written. The scene calls it on each screen it makes (the players' with
' theirs), and each list item on itself: a component in a screen's markup
' is the screen's. Twice on a node changes nothing more (Theme.brs's test).
sub uiRecolor(node as object)
    tints = uiTints()
    if tints.Count() > 0 then uiRecolorWith(node, tints)
end sub

sub uiRecolorWith(node as object, tints as object)
    kind = node.subtype()
    if kind = "Label" or kind = "Rectangle" or kind = "ScrollingLabel" or kind = "SimpleLabel"
        uiRecolorField(node, "color", tints)
    else if kind = "Poster"
        uiRecolorField(node, "blendColor", tints)
    else if kind <> "Group" and kind <> "LayoutGroup" and kind <> "MaskGroup" and kind <> "Timer"
        for each field in ["color", "blendColor", "focusedColor", "rowLabelColor", "focusBitmapBlendColor", "focusFootprintBlendColor", "channelInfoTextColor", "programTitleColor", "programTitleFocusedColor", "timeLabelColor", "nowBarBlendColor", "textColor", "focusedTextColor"]
            if node.hasField(field) then uiRecolorField(node, field, tints)
        end for
    end if
    for each child in node.getChildren(-1, 0)
        uiRecolorWith(child, tints)
    end for
end sub

' A color written in Dark's, the look's. Set as markup sets it (update):
' setField takes no string for a color field.
sub uiRecolorField(node as object, field as string, tints as object)
    color = uiColorText(node.getField(field))
    if Len(color) <> 10 then return
    shown = tints[Mid(color, 3, 6)]
    if shown = invalid then return
    fields = {}
    fields[field] = "0x" + shown + Right(color, 2)
    node.update(fields)
end sub

' A color field's value as "0xRRGGBBAA": a Roku gives a color field back
' as an integer, a string field as it was set.
function uiColorText(value as dynamic) as string
    kind = type(value)
    if kind = "String" or kind = "roString" then return value
    if kind <> "Integer" and kind <> "roInt" then return ""
    n = value
    digits = ""
    for i = 1 to 8
        digits = Mid("0123456789ABCDEF", (n and 15) + 1, 1) + digits
        n = n >> 4
    end for
    return "0x" + digits
end function
