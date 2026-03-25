const { Menu, clipboard, shell } = require('electron')
import { pub } from './public'
// 右键菜单配置
class ContextMenu {
  event: any
  params: any
  constructor(event: any, params: any) {
    this.event = event
    this.params = params
  }

  /**
   * @name 创建右键菜单
   */
  get_context_menu() {
    let that = this
    let template: object[] = []

    if (that.params.selectionText) {
      // 是否有选中内容
      if (that.params.selectionText) {
        template.push({
          id: 1,
          label: pub.lang('复制'),
          role: 'copy',
        })

        template.push({
          id: 2,
          label: pub.lang('剪切'),
          role: 'cut',
        })
      }
    }

    let is_link = false

    let clipboard_text = clipboard.readText()
    if (clipboard_text) {
      template.push({
        id: 3,
        label: pub.lang('粘贴'),
        role: 'paste',
      })
    }

    template.push({
      id: 4,
      label: pub.lang('全选'),
      role: 'selectAll',
    })

    if (that.params.selectionText) {
      // 粘贴选中的内容
      // template.push({
      //     id:5,
      //     label:pub.lang("粘贴选中内容"),
      //     accelerator: "",
      //     click: function () {
      //         // 粘贴选中的内容
      //         that.event.sender.copy();
      //         that.event.sender.paste();
      //     }
      // });

      // 选中内容是否为链接
      is_link = that.params.selectionText.match(/(http|https):\/\/([\w.]+\/?)\S*/)
      if (is_link) {
        template.push({
          id: 6,
          label: pub.lang('打开链接'),
          accelerator: '',
          click: function () {
            shell.openExternal(that.params.selectionText)
          },
        })
      }
    }

    return Menu.buildFromTemplate(template)
  }
}

export { ContextMenu }
