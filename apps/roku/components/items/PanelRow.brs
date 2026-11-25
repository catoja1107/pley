sub init()
    m.name = m.top.findNode("name")
    m.note = m.top.findNode("note")
    m.check = m.top.findNode("check")
    m.fill = m.top.findNode("fill")
    m.swatch = m.top.findNode("swatch")
    m.swatchEdge = m.top.findNode("swatchEdge")
    m.name.font = uiType("label")
    m.note.font = uiType("caption")
    m.content = invalid
    m.rowWidth = 608
    m.rowHeight = 88
    ' Where the words start: after the swatch, where there is one.
    m.wordsX = 32
end sub

' The row's size, the list's: the words between 32 px either side and the
' check, the check in the middle at the right.
sub onLayout()
    if m.top.width > 0 then m.rowWidth = m.top.width
    if m.top.height > 0 then m.rowHeight = m.top.height
    m.fill.width = m.rowWidth
    m.fill.height = m.rowHeight
    m.check.translation = [m.rowWidth - 72, (m.rowHeight - 40) / 2]
    m.swatch.translation = [32, (m.rowHeight - 36) / 2]
    placeWords()
end sub

sub onContent()
    entry = m.top.itemContent
    if entry = invalid then return
    ' The pages' panels and the player's: the item knows whose by its
    ' content.
    uiRecolorFor(entry)
    m.content = entry
    m.name.text = entry.title
    ' 简体中文 and 繁體中文 among the languages, in a font that has them.
    m.name.font = uiFontFor(entry.title, "medium", 28)
    note = ""
    if entry.description <> invalid then note = entry.description
    m.note.text = note
    m.note.visible = note <> ""
    ' An accent's color, as the look shows it: not tinted again.
    swatch = ""
    if entry.hasField("swatch") then swatch = entry.swatch
    m.swatch.visible = swatch <> ""
    if swatch <> "" then m.swatch.blendColor = swatch
    m.wordsX = 32
    if swatch <> "" then m.wordsX = 88
    placeWords()
    ' A sort's order shows as its arrow where a check would be: Lucide's
    ' rising and falling bars, as the other apps mark it.
    arrow = ""
    if entry.hasField("arrow") then arrow = entry.arrow
    if arrow = "up"
        m.check.uri = "pkg:/images/ui/icon-arrow-up-narrow-wide-40.png"
    else if arrow = "down"
        m.check.uri = "pkg:/images/ui/icon-arrow-down-wide-narrow-40.png"
    else
        m.check.uri = "pkg:/images/ui/icon-check-40.png"
    end if
    m.check.visible = arrow <> "" or (entry.hasField("checked") and entry.checked = true)
    onFocus()
end sub

' With a note, the name sits higher and the note under it.
sub placeWords()
    m.name.width = m.rowWidth - m.wordsX - 88
    m.note.width = m.rowWidth - m.wordsX - 88
    if m.note.visible
        m.name.translation = [m.wordsX, m.rowHeight / 2 - 34]
        m.name.height = 40
        m.note.translation = [m.wordsX, m.rowHeight / 2 + 4]
    else
        m.name.translation = [m.wordsX, 0]
        m.name.height = m.rowHeight
    end if
end sub

sub onFocus()
    focused = m.top.itemHasFocus and m.top.listHasFocus
    m.fill.visible = focused
    if focused
        m.name.color = uiTint("0x16191EFF")
        m.note.color = uiTint("0x16191ECC")
        m.check.blendColor = uiTint("0x16191EFF")
        m.swatchEdge.blendColor = uiTint("0x16191EFF")
    else
        m.name.color = uiTint("0xEBEBEBFF")
        m.note.color = uiTint("0xA1A9B6FF")
        m.check.blendColor = uiTint("0x38BDF8FF")
        m.swatchEdge.blendColor = uiTint("0xEBEBEB66")
    end if
end sub
