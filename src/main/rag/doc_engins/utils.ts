// 常量
import { pub } from '../../class/public'
export const IMAGE_URL_LAST = '{URL}/rag'

export function get_image_save_path() {
  return pub.get_data_path() + '/rag/'
}

export function get_doc_save_path() {
  return pub.get_data_path() + '/rag/'
}
