param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $TextParts
)

$text = (($TextParts -join ' ') -replace '^\s*"', '' -replace '"\s*$', '').Trim()
if ([string]::IsNullOrWhiteSpace($text)) {
  exit 0
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Speech

$configPath = Join-Path $PSScriptRoot 'triggernometry-tts-subtitle-position.json'

$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.Rate = 0
$speaker.Volume = 100

$form = New-Object System.Windows.Forms.Form
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$form.ShowInTaskbar = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::FromArgb(12, 12, 12)
$form.Opacity = 0.88
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.Cursor = [System.Windows.Forms.Cursors]::SizeAll

$label = New-Object System.Windows.Forms.Label
$label.Text = $text
$label.ForeColor = [System.Drawing.Color]::FromArgb(255, 248, 232)
$label.BackColor = [System.Drawing.Color]::Transparent
$label.Font = New-Object System.Drawing.Font('Microsoft JhengHei', 34, [System.Drawing.FontStyle]::Bold)
$label.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
$label.AutoSize = $false
$label.Padding = New-Object System.Windows.Forms.Padding(16, 10, 16, 12)

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$width = [Math]::Min([Math]::Max(420, [int]($screen.Width * 0.34)), [int]($screen.Width * 0.72))
$height = 116
$form.Size = New-Object System.Drawing.Size($width, $height)

$defaultX = [int](($screen.Width - $width) / 2)
$defaultY = [int]($screen.Height * 0.62)
$savedX = $defaultX
$savedY = $defaultY
if (Test-Path -LiteralPath $configPath) {
  try {
    $saved = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if ($null -ne $saved.x -and $null -ne $saved.y) {
      $savedX = [int]$saved.x
      $savedY = [int]$saved.y
    }
  } catch {
  }
}
$savedX = [Math]::Max($screen.Left, [Math]::Min($savedX, $screen.Right - $width))
$savedY = [Math]::Max($screen.Top, [Math]::Min($savedY, $screen.Bottom - $height))
$form.Location = New-Object System.Drawing.Point($savedX, $savedY)

$label.Dock = [System.Windows.Forms.DockStyle]::Fill
$label.Cursor = [System.Windows.Forms.Cursors]::SizeAll
$form.Controls.Add($label)

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 4000
$timer.Add_Tick({
  $timer.Stop()
  $form.Close()
})

$form.Add_Shown({
  $timer.Start()
  [void]$speaker.SpeakAsync($text)
})

$script:dragging = $false
$script:dragStart = New-Object System.Drawing.Point(0, 0)
$startDrag = {
  param($sender, $event)
  if ($event.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
    $script:dragging = $true
    $script:dragStart = New-Object System.Drawing.Point($event.X, $event.Y)
  }
}
$moveDrag = {
  param($sender, $event)
  if ($script:dragging) {
    $form.Left = $form.Left + $event.X - $script:dragStart.X
    $form.Top = $form.Top + $event.Y - $script:dragStart.Y
  }
}
$endDrag = {
  param($sender, $event)
  if ($script:dragging) {
    $script:dragging = $false
    @{
      x = $form.Left
      y = $form.Top
    } | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8
  }
}

$form.Add_MouseDown($startDrag)
$form.Add_MouseMove($moveDrag)
$form.Add_MouseUp($endDrag)
$label.Add_MouseDown($startDrag)
$label.Add_MouseMove($moveDrag)
$label.Add_MouseUp($endDrag)

$form.Add_FormClosed({
  try {
    $speaker.SpeakAsyncCancelAll()
    $speaker.Dispose()
  } catch {
  }
})

[void]$form.ShowDialog()
