# Rebuild js/questions.js from Kass/MCAT scrape with passage inheritance + cleaned choices.
$ErrorActionPreference = "Stop"
$mdPath = "C:\Users\C2K\family\Kass\MCAT\aamc-sample-test-q1-50.md"
$outJs = "C:\Users\C2K\family\Kass\mcat-mastery-game\js\questions.js"
$md = Get-Content -Raw -Encoding UTF8 $mdPath

$topics = @{
  1='enzyme_inhibition'; 2='stereochemistry'; 3='solubility_ksp'; 4='peptide_bonds'
  5='electric_fields'; 6='nervous_system'; 7='membrane_transport'; 8='waves_circuits'
  9='circuits_ohm'; 10='acids_bases_ph'; 11='acids_bases'; 12='acids_bases'; 13='periodic_trends'
  14='lipid_metabolism'; 15='stoichiometry'; 16='carbohydrates'; 17='amino_acids'; 18='separations'
  19='enzyme_kinetics'; 20='enzyme_kinetics'; 21='redox'; 22='redox'; 23='fluids_pressure'
  24='gas_laws'; 25='experimental_design'; 26='density_units'; 27='waves_doppler'
  28='intermolecular_forces'; 29='atomic_structure'; 30='binding'; 31='binding'; 32='binding'
  33='binding'; 34='density_units'; 35='graphs'; 36='thermodynamics'; 37='circuits_ohm'
  38='organic_chemistry'; 39='organic_chemistry'; 40='spectroscopy'; 41='stereochemistry'
  42='metabolism'; 43='optics'; 44='phase_changes'; 45='organic_chemistry'; 46='fluids_buoyancy'
  47='biochemistry'; 48='biochemistry'; 49='biochemistry'; 50='biochemistry'
}

$passageCanon = @{
  'Passage 1 (Questions 1-4)' = 'HIV protease is an aspartyl protease that cleaves viral polyproteins into functional proteins required for viral maturation. Compound 1 is a peptidomimetic that binds the active site. Treatment with Compound 1 can increase urinary oxalate in some patients, raising the risk of calcium oxalate kidney stones. The cleavage site preferences of HIV protease are used to interpret which peptide bond is cut.'
  'Passage 2 (Questions 5-9)' = 'The central nervous system uses electrical signaling along axons. The axon interior is typically negatively charged relative to the extracellular fluid. Myelin alters cable properties of the axon. Channel X in the passage is a cation channel relevant to action-potential currents. Nerve conduction velocity (NCV) testing places electrodes along a nerve; resolution limits and Ohms-law relations constrain what distances and parameters are usable.'
  'Passage 3 (Questions 10-13)' = 'Hydrated oxides and acid-base indicators are used to characterize an unknown aqueous solution. Relative acid strengths, conjugate pairs, and periodic trends among oxides inform which species dominate at a measured pH.'
  'Passage 4 (Questions 18-21)' = 'A drug-metabolism study examines CYP2C9 kinetics using Lineweaver-Burk style analysis and inhibitor effects. Interpret intercepts, slopes, and how competitive vs noncompetitive patterns appear when reciprocal plots are compared.'
  'Passage 5 (Questions 22-25)' = 'A redox titration and gas-law / pressure context are used together with experimental design constraints. Track oxidation states, stoichiometry, and which controlled variables are required for a valid measurement.'
  'Passage 6 (Questions 30-33)' = 'Binding data for a ligand with BSA (or similar protein) are presented in tables/figures. Deduce the number of binding sites and relative affinities from how occupancy changes with concentration.'
  'Passage 7 (Questions 34-37)' = 'A heated wire / resistance experiment relates temperature, geometry, and electrical response. Graphs of T vs R and thermal/electrical relations are the focus.'
  'Passage 8 (Questions 38-42)' = 'Squalene and related isoprene / steroid biochemistry problems require tracking carbon labels, IR features, chirality, and metabolic fate of intermediates.'
  'Passage 9 (Questions 47-51)' = 'Amygdalin / CoA / buoyancy-style biochemistry items ask you to connect structure to pathway roles and physical principles stated in the passage figures/tables.'
}

$figureMap = @{
  5 = 'assets/figures/q5-field-lines.svg'
  35 = 'assets/figures/q35-t-vs-r.svg'
}

function Clean-Text([string]$s) {
  if ($null -eq $s) { return $null }
  $t = $s -replace '\[web:\d+\]', ''
  $t = $t -replace '\s+', ' '
  return $t.Trim()
}

function Escape-Json([string]$s) {
  if ($null -eq $s) { return 'null' }
  $j = $s.Replace('\', '\\').Replace('"', '\"').Replace("`n", '\n').Replace("`r", '')
  return '"' + $j + '"'
}

$blocks = [regex]::Split($md, '(?m)^## Question ') | Where-Object { $_ -match '^\d+' }
$questions = New-Object System.Collections.Generic.List[object]
$lastPassageLabel = $null
$lastPassageBody = $null

foreach ($b in $blocks) {
  if ($b -notmatch '^(?<n>\d+)\s*') { continue }
  $n = [int]$Matches['n']

  $passageLabel = $null
  if ($b -match '\*\*(Passage [^*]+)\*\*') {
    $passageLabel = Clean-Text $Matches[1]
  }
  $passageBody = $null
  if ($b -match '(?s)\*\*Passage [^*]+\*\*\s*(.*?)\*\*Question:\*\*') {
    $raw = Clean-Text $Matches[1]
    if ($raw -and $raw.Length -gt 8) { $passageBody = $raw }
  }
  if ($passageLabel) {
    $lastPassageLabel = $passageLabel
    if ($passageBody) { $lastPassageBody = $passageBody }
    elseif ($passageCanon.ContainsKey($passageLabel)) { $lastPassageBody = $passageCanon[$passageLabel] }
  }

  $stem = $null
  if ($b -match '\*\*Question:\*\*\s*(.+?)(?=\r?\n-\s*[A-D]\.|$)') {
    $stem = Clean-Text $Matches[1]
  }

  $choices = @{}
  foreach ($L in @('A','B','C','D')) {
    # Use [regex]::Match so empty groups do not inherit stale $Matches from prior -match calls
    $pat = '(?m)^-\s*' + $L + '\.\s*(.*)$'
    $m = [regex]::Match($b, $pat)
    if ($m.Success) { $choices[$L] = Clean-Text $m.Groups[1].Value }
    else { $choices[$L] = '' }
  }

  # Clean scrambled image-choice leftovers like "- B."
  foreach ($L in @('A','B','C','D')) {
    $c = [string]$choices[$L]
    if (-not $c -or $c -match 'Your Result' -or $c -match '^-\s*[A-D]') {
      $choices[$L] = ''
    }
  }
  $emptyChoices = 0
  foreach ($L in @('A','B','C','D')) {
    if (-not $choices[$L]) { $emptyChoices++ }
  }
  $needsFigure = ($stem -match 'image|figure|graph|diagram') -or ($emptyChoices -ge 2)
  if ($needsFigure) {
    foreach ($L in @('A','B','C','D')) {
      if (-not $choices[$L]) {
        $choices[$L] = "Option $L (see diagram panel)"
      }
    }
  }

  $correct = $null
  if ($b -match '\*\*Correct Answer:\*\*\s*([A-D])') { $correct = $Matches[1] }
  $your = $null
  if ($b -match '\*\*Your Answer:\*\*\s*([A-D])') { $your = $Matches[1] }
  $result = $null
  if ($b -match '\*\*Your Result:\*\*\s*(\w+)') { $result = $Matches[1] }
  $solution = $null
  if ($b -match '(?s)\*\*Solution:\*\*\s*(.+)') { $solution = Clean-Text $Matches[1] }

  # Only attach a passage when this question declares one (or continues same labeled block)
  $passText = $null
  $passLab = $null
  if ($passageLabel) {
    $passLab = $passageLabel
    if ($passageCanon.ContainsKey($passLab)) { $passText = $passageCanon[$passLab] }
    elseif ($passageBody) { $passText = $passageBody }
    elseif ($lastPassageBody) { $passText = $lastPassageBody }
  } elseif ($lastPassageLabel -and $n -ge 1) {
    # Continue passage for subsequent items that omit the body but keep the same group in label history
    # Only if the prior question numbers still fall in that passage's stated range
    if ($lastPassageLabel -match 'Questions\s+(\d+)\s*-\s*(\d+)') {
      $lo = [int]$Matches[1]; $hi = [int]$Matches[2]
      if ($n -ge $lo -and $n -le $hi) {
        $passLab = $lastPassageLabel
        if ($passageCanon.ContainsKey($passLab)) { $passText = $passageCanon[$passLab] }
        else { $passText = $lastPassageBody }
      }
    }
  }

  $fig = $null
  if ($figureMap.ContainsKey($n)) { $fig = $figureMap[$n] }
  elseif ($needsFigure) { $fig = 'assets/figures/generic-diagram.svg' }

  $questions.Add([pscustomobject]@{
    id = "aamc-sample-q$n"
    number = $n
    passageLabel = $passLab
    passage = $passText
    stem = $stem
    choices = $choices
    correct = $correct
    solution = $solution
    topic = $(if ($topics.ContainsKey($n)) { $topics[$n] } else { 'general' })
    image = $fig
    figureNote = $(if ($fig) { 'Study schematic (scrape had no official figure files).' } else { $null })
    diagResult = $result
    diagAnswer = $your
  }) | Out-Null
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('// Auto-rebuilt from Kass/MCAT scrape — passages inherited; figures are study schematics.')
[void]$sb.AppendLine('window.QUESTION_PACK = {')
[void]$sb.AppendLine('  "title": "AAMC Sample Chem/Phys Q1-50",')
[void]$sb.AppendLine('  "section": "Chemical and Physical Foundations of Biological Systems",')
[void]$sb.AppendLine("  `"count`": $($questions.Count),")
[void]$sb.AppendLine('  "questions": [')

for ($i = 0; $i -lt $questions.Count; $i++) {
  $q = $questions[$i]
  $ch = $q.choices
  $comma = if ($i -lt $questions.Count - 1) { ',' } else { '' }
  $img = if ($q.image) { Escape-Json $q.image } else { 'null' }
  $fnote = if ($q.figureNote) { Escape-Json $q.figureNote } else { 'null' }
  $pass = if ($q.passage) { Escape-Json $q.passage } else { 'null' }
  $plab = if ($q.passageLabel) { Escape-Json $q.passageLabel } else { 'null' }
  $diagR = if ($q.diagResult) { Escape-Json $q.diagResult } else { 'null' }
  $diagA = if ($q.diagAnswer) { Escape-Json $q.diagAnswer } else { 'null' }
  [void]$sb.AppendLine('    {')
  [void]$sb.AppendLine("      `"id`": $(Escape-Json $q.id),")
  [void]$sb.AppendLine("      `"number`": $($q.number),")
  [void]$sb.AppendLine('      "section": "Chem/Phys",')
  [void]$sb.AppendLine("      `"passageLabel`": $plab,")
  [void]$sb.AppendLine("      `"passage`": $pass,")
  [void]$sb.AppendLine("      `"stem`": $(Escape-Json $q.stem),")
  [void]$sb.AppendLine('      "choices": {')
  [void]$sb.AppendLine("        `"A`": $(Escape-Json $ch.A),")
  [void]$sb.AppendLine("        `"B`": $(Escape-Json $ch.B),")
  [void]$sb.AppendLine("        `"C`": $(Escape-Json $ch.C),")
  [void]$sb.AppendLine("        `"D`": $(Escape-Json $ch.D)")
  [void]$sb.AppendLine('      },')
  [void]$sb.AppendLine("      `"correct`": $(Escape-Json $q.correct),")
  [void]$sb.AppendLine("      `"solution`": $(Escape-Json $q.solution),")
  [void]$sb.AppendLine("      `"topic`": $(Escape-Json $q.topic),")
  [void]$sb.AppendLine('      "skill": "practice",')
  [void]$sb.AppendLine("      `"image`": $img,")
  [void]$sb.AppendLine("      `"figureNote`": $fnote,")
  [void]$sb.AppendLine("      `"diagnostic`": { `"result`": $diagR, `"yourAnswer`": $diagA }")
  [void]$sb.AppendLine("    }$comma")
}
[void]$sb.AppendLine('  ]')
[void]$sb.AppendLine('};')

[System.IO.File]::WriteAllText($outJs, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))
$withP = ($questions | Where-Object { $_.passage }).Count
$withI = ($questions | Where-Object { $_.image }).Count
Write-Host "Wrote $($questions.Count) questions withPassage=$withP withImage=$withI"
