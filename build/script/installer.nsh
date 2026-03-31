!macro customUnInstall
  ; 删除安装目录下的残留文件
  RMDir /r "$INSTDIR"
!macroend
