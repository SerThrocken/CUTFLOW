!include "MUI2.nsh"

;--------------------------------
;General

  ;Name and file
  Name "CutFlow"
  OutFile "CutFlow-Setup-x64.exe"
  Unicode True

  ;Default installation folder
  InstallDir "$PROGRAMFILES64\CutFlow"
  
  ;Get installation folder from registry if available
  InstallDirRegKey HKCU "Software\CutFlow" ""

  ;Request application privileges for Windows Vista+
  RequestExecutionLevel admin

;--------------------------------
;Interface Settings

  !define MUI_ABORTWARNING

;--------------------------------
;Pages

  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH

  !insertmacro MUI_UNPAGE_WELCOME
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  !insertmacro MUI_UNPAGE_FINISH

;--------------------------------
;Languages
 
  !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections

Section "Dummy Section" SecDummy

  SetOutPath "$INSTDIR"
  
  ;ADD YOUR OWN FILES HERE...
  File "..\..\target\release\cutflow.exe"
  
  ;Store installation folder
  WriteRegStr HKCU "Software\CutFlow" "" $INSTDIR
  
  ;Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ;Create shortcuts
  CreateDirectory "$SMPROGRAMS\CutFlow"
  CreateShortcut "$SMPROGRAMS\CutFlow\CutFlow.lnk" "$INSTDIR\cutflow.exe"
  CreateShortcut "$SMPROGRAMS\CutFlow\Uninstall CutFlow.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\CutFlow.lnk" "$INSTDIR\cutflow.exe"

SectionEnd

;--------------------------------
;Uninstaller Section

Section "Uninstall"

  ;ADD YOUR OWN FILES HERE...
  Delete "$INSTDIR\cutflow.exe"
  Delete "$INSTDIR\Uninstall.exe"

  RMDir "$INSTDIR"
  
  Delete "$SMPROGRAMS\CutFlow\CutFlow.lnk"
  Delete "$SMPROGRAMS\CutFlow\Uninstall CutFlow.lnk"
  RMDir "$SMPROGRAMS\CutFlow"
  Delete "$DESKTOP\CutFlow.lnk"

  DeleteRegKey /ifempty HKCU "Software\CutFlow"

SectionEnd
