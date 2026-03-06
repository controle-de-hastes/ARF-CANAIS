import { getDirectoryHandle, verifyPermission } from './idb';
import { Customer, Server, Plan, Renewal, ManualAddition } from '../types';

interface AppData {
    customers: Customer[];
    servers: Server[];
    plans: Plan[];
    renewals: Renewal[];
    manualAdditions: ManualAddition[];
    appIcon: string | null;
    appCover: string | null;
}

export async function performLocalBackup(data: AppData): Promise<boolean> {
    try {
        const isAutoBackupEnabled = localStorage.getItem('arf_auto_backup_enabled') === 'true';
        if (!isAutoBackupEnabled) return false;

        const handle = await getDirectoryHandle();
        if (!handle) {
            console.warn('Backup Automático Falhou: Nenhum diretório configurado.');
            return false;
        }

        const hasPermission = await verifyPermission(handle, false); // No user gesture in background
        if (!hasPermission) {
            console.warn('Backup Automático Falhou: Permissão necessária para acessar a pasta. O usuário precisa conceder permissão na aba Dados.');
            return false;
        }

        const date = new Date();
        // Use yyyy-MM-dd format for filename
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const filename = `backup_arf_auto_${dateStr}.json`;

        const exportData = {
            ...data,
            version: '1.2',
            exportDate: date.toISOString(),
            type: 'auto_weekly'
        };

        const fileHandle = await handle.getFileHandle(filename, { create: true });

        // Type assertion is needed because typescript typings for File System Access API might be slightly outdated/restrictive
        const writable = await (fileHandle as any).createWritable();
        await writable.write(JSON.stringify(exportData, null, 2));
        await writable.close();

        console.log(`Backup automático salvo com sucesso: ${filename}`);
        localStorage.setItem('arf_last_auto_backup', date.toISOString());
        return true;
    } catch (err: any) {
        console.error('Erro ao realizar backup automático:', err);
        // Let it fail silently from the user's perspective if it's a background task, just log it.
        return false;
    }
}
