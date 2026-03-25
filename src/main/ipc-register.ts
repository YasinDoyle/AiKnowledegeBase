/**
 * 统一注册所有 IPC handlers
 * 替代 ElectronEgg 的 Controller 自动路由
 *
 * 命名规则：'controller名:方法名'
 * 前端调用：window.ipcRenderer.invoke('chat:get_chat_list')
 */
import { ipcMain } from 'electron'

// 导入所有 controller（统一导出类，在此处统一实例化）
import IndexController from './controller/index'
import ChatController from './controller/chat'
import AgentController from './controller/agent'
import ManagerController from './controller/manager'
import McpController from './controller/mcp'
import ModelController from './controller/model'
import OsController from './controller/os'
import RagController from './controller/rag'
import SearchController from './controller/search'
import ShareController from './controller/share'

export function registerIpcHandlers() {
  const indexCtrl = new IndexController()
  const chatCtrl = new ChatController()
  const agentCtrl = new AgentController()
  const managerCtrl = new ManagerController()
  const mcpCtrl = new McpController()
  const modelCtrl = new ModelController()
  const osCtrl = new OsController()
  const ragCtrl = new RagController()
  const searchCtrl = new SearchController()
  const shareCtrl = new ShareController()

  // ---- IndexController ----
  ipcMain.handle('index:get_version', () => indexCtrl.get_version())
  ipcMain.handle('index:get_languages', () => indexCtrl.get_languages())
  ipcMain.handle('index:set_language', (_e, args) => indexCtrl.set_language(args))
  ipcMain.handle('index:get_client_language', () => indexCtrl.get_client_language())
  ipcMain.handle('index:get_server_language', () => indexCtrl.get_server_language())
  ipcMain.handle('index:select_folder', (_e, args) => indexCtrl.select_folder(args, _e))
  ipcMain.handle('index:write_logs', (_e, args) => indexCtrl.write_logs(args))
  ipcMain.handle('index:get_data_save_path', () => indexCtrl.get_data_save_path())
  ipcMain.handle('index:set_data_save_path', (_e, args) => indexCtrl.set_data_save_path(args))

  // ---- ChatController ----
  ipcMain.handle('chat:get_chat_list', () => chatCtrl.get_chat_list())
  ipcMain.handle('chat:create_chat', (_e, args) => chatCtrl.create_chat(args))
  ipcMain.handle('chat:get_model_list', () => chatCtrl.get_model_list())
  ipcMain.handle('chat:chat', (_e, args) => chatCtrl.chat(args, _e))
  ipcMain.handle('chat:get_chat_info', (_e, args) => chatCtrl.get_chat_info(args))
  ipcMain.handle('chat:remove_chat', (_e, args) => chatCtrl.remove_chat(args))
  ipcMain.handle('chat:modify_chat_title', (_e, args) => chatCtrl.modify_chat_title(args))
  ipcMain.handle('chat:delete_chat_history', (_e, args) => chatCtrl.delete_chat_history(args))
  ipcMain.handle('chat:stop_generate', (_e, args) => chatCtrl.stop_generate(args))
  ipcMain.handle('chat:get_last_chat_history', (_e, args) => chatCtrl.get_last_chat_history(args))

  // ---- AgentController ----
  ipcMain.handle('agent:create_agent', (_e, args) => agentCtrl.create_agent(args))
  ipcMain.handle('agent:get_agent_list', (_e, args) => agentCtrl.get_agent_list(args))
  ipcMain.handle('agent:modify_agent', (_e, args) => agentCtrl.modify_agent(args))
  ipcMain.handle('agent:remove_agent', (_e, args) => agentCtrl.remove_agent(args))
  ipcMain.handle('agent:get_agent_info', (_e, args) => agentCtrl.get_agent_info(args))

  // ---- ManagerController ----
  ipcMain.handle('manager:get_model_manager', () => managerCtrl.get_model_manager())
  ipcMain.handle('manager:install_model', (_e, args) => managerCtrl.install_model(args))
  ipcMain.handle('manager:get_model_install_progress', (_e, args) =>
    managerCtrl.get_model_install_progress(args),
  )
  ipcMain.handle('manager:remove_model', (_e, args) => managerCtrl.remove_model(args))
  ipcMain.handle('manager:install_model_manager', (_e, args) =>
    managerCtrl.install_model_manager(args),
  )
  ipcMain.handle('manager:get_model_manager_install_progress', (_e, args) =>
    managerCtrl.get_model_manager_install_progress(args),
  )
  ipcMain.handle('manager:get_configuration_info', () => managerCtrl.get_configuration_info())
  ipcMain.handle('manager:get_disk_list', () => managerCtrl.get_disk_list())
  ipcMain.handle('manager:set_ollama_model_save_path', (_e, args) =>
    managerCtrl.set_ollama_model_save_path(args),
  )
  ipcMain.handle('manager:reconnect_model_download', () => managerCtrl.reconnect_model_download())
  ipcMain.handle('manager:set_ollama_host', (_e, args) => managerCtrl.set_ollama_host(args))

  // ---- McpController ----
  ipcMain.handle('mcp:get_mcp_server_list', (_e, args) => mcpCtrl.get_mcp_server_list(args))
  ipcMain.handle('mcp:get_common_server_list', (_e, args) => mcpCtrl.get_common_server_list(args))
  ipcMain.handle('mcp:get_mcp_server_info', (_e, args) => mcpCtrl.get_mcp_server_info(args))
  ipcMain.handle('mcp:modify_mcp_server', (_e, args) => mcpCtrl.modify_mcp_server(args))
  ipcMain.handle('mcp:remove_mcp_server', (_e, args) => mcpCtrl.remove_mcp_server(args))
  ipcMain.handle('mcp:add_mcp_server', (_e, args) => mcpCtrl.add_mcp_server(args))
  ipcMain.handle('mcp:modify_mcp_tools', (_e, args) => mcpCtrl.modify_mcp_tools(args))
  ipcMain.handle('mcp:get_mcp_tools', (_e, args) => mcpCtrl.get_mcp_tools(args))
  ipcMain.handle('mcp:get_status', (_e, args) => mcpCtrl.get_status(args))
  ipcMain.handle('mcp:install_npx', (_e, args) => mcpCtrl.install_npx(args))
  ipcMain.handle('mcp:install_uv', (_e, args) => mcpCtrl.install_uv(args))
  ipcMain.handle('mcp:get_mcp_config_body', (_e, args) => mcpCtrl.get_mcp_config_body(args))
  ipcMain.handle('mcp:save_mcp_config_body', (_e, args) => mcpCtrl.save_mcp_config_body(args))
  ipcMain.handle('mcp:get_registry_list', (_e, args) => mcpCtrl.get_registry_list(args))
  ipcMain.handle('mcp:sync_cloud_mcp', (_e, args) => mcpCtrl.sync_cloud_mcp(args))

  // ---- ModelController ----
  ipcMain.handle('model:get_supplier_list', (_e, args) => modelCtrl.get_supplier_list(args))
  ipcMain.handle('model:get_models_list', (_e, args) => modelCtrl.get_models_list(args))
  ipcMain.handle('model:add_models', (_e, args) => modelCtrl.add_models(args))
  ipcMain.handle('model:remove_models', (_e, args) => modelCtrl.remove_models(args))
  ipcMain.handle('model:set_supplier_config', (_e, args) => modelCtrl.set_supplier_config(args))
  ipcMain.handle('model:check_supplier_config', (_e, args) => modelCtrl.check_supplier_config(args))
  ipcMain.handle('model:get_supplier_config', (_e, args) => modelCtrl.get_supplier_config(args))
  ipcMain.handle('model:set_supplier_status', (_e, args) => modelCtrl.set_supplier_status(args))
  ipcMain.handle('model:set_model_status', (_e, args) => modelCtrl.set_model_status(args))
  ipcMain.handle('model:add_supplier', (_e, args) => modelCtrl.add_supplier(args))
  ipcMain.handle('model:remove_supplier', (_e, args) => modelCtrl.remove_supplier(args))
  ipcMain.handle('model:get_online_models', (_e, args) => modelCtrl.get_online_models(args))
  ipcMain.handle('model:set_model_title', (_e, args) => modelCtrl.set_model_title(args))
  ipcMain.handle('model:set_model_capability', (_e, args) => modelCtrl.set_model_capability(args))
  ipcMain.handle('model:modify_model', (_e, args) => modelCtrl.modify_model(args))
  ipcMain.handle('model:sync_supplier_template', () => modelCtrl.sync_supplier_template())

  // ---- OsController ----
  ipcMain.handle('os:openDirectory', (_e, args) => osCtrl.openDirectory(args))
  ipcMain.handle('os:selectPic', () => osCtrl.selectPic())

  // ---- RagController ----
  ipcMain.handle('rag:rag_status', () => ragCtrl.rag_status())
  ipcMain.handle('rag:get_embedding_models', () => ragCtrl.get_embedding_models())
  ipcMain.handle('rag:create_rag', (_e, args) => ragCtrl.create_rag(args))
  ipcMain.handle('rag:remove_rag', (_e, args) => ragCtrl.remove_rag(args))
  ipcMain.handle('rag:get_rag_list', () => ragCtrl.get_rag_list())
  ipcMain.handle('rag:modify_rag', (_e, args) => ragCtrl.modify_rag(args))
  ipcMain.handle('rag:upload_doc', (_e, args) => ragCtrl.upload_doc(args))
  ipcMain.handle('rag:get_rag_doc_list', (_e, args) => ragCtrl.get_rag_doc_list(args))
  ipcMain.handle('rag:get_doc_content', (_e, args) => ragCtrl.get_doc_content(args))
  ipcMain.handle('rag:download_doc', (_e, args) => ragCtrl.download_doc(args, _e))
  ipcMain.handle('rag:remove_doc', (_e, args) => ragCtrl.remove_doc(args))
  ipcMain.handle('rag:reindex_document', (_e, args) => ragCtrl.reindex_document(args))
  ipcMain.handle('rag:reindex_rag', (_e, args) => ragCtrl.reindex_rag(args))
  ipcMain.handle('rag:search_document', (_e, args) => ragCtrl.search_document(args))
  ipcMain.handle('rag:images', (_e, args) => ragCtrl.images(args, _e))
  ipcMain.handle('rag:test_chunk', (_e, args) => ragCtrl.test_chunk(args))
  ipcMain.handle('rag:optimize_table', (_e, args) => ragCtrl.optimize_table(args))
  ipcMain.handle('rag:get_doc_chunk_list', (_e, args) => ragCtrl.get_doc_chunk_list(args))
  ipcMain.handle('rag:get_embedding_map', () => ragCtrl.get_embedding_map())

  // ---- SearchController ----
  ipcMain.handle('search:search', (_e, args) => searchCtrl.search(args))

  // ---- ShareController ----
  ipcMain.handle('share:get_share_list', () => shareCtrl.get_share_list())
  ipcMain.handle('share:remove_share', (_e, args) => shareCtrl.remove_share(args))
  ipcMain.handle('share:create_share', (_e, args) => shareCtrl.create_share(args))
  ipcMain.handle('share:modify_share', (_e, args) => shareCtrl.modify_share(args))
  ipcMain.handle('share:get_share_chat_history', (_e, args) =>
    shareCtrl.get_share_chat_history(args),
  )
  ipcMain.handle('share:set_share_service_status', (_e, args) =>
    shareCtrl.set_share_service_status(args),
  )

  console.log('[IPC] All handlers registered')
}
