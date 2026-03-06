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

        const handle = await getDirectoryHandle();

        let savedToDir = false;

        // Try File System Access API first if we have a handle
        if (handle) {
            const hasPermission = await verifyPermission(handle, false); // No user gesture in background
            if (hasPermission) {
                try {
                    const fileHandle = await handle.getFileHandle(filename, { create: true });
                    const writable = await (fileHandle as any).createWritable();
                    await writable.write(JSON.stringify(exportData, null, 2));
                    await writable.close();

                    console.log(`Backup automático salvo com sucesso na pasta selecionada: ${filename}`);
                    savedToDir = true;
                } catch (e) {
                    console.error('Falha ao escrever no diretório escolhido, tentaremos fallback.', e);
                }
            } else {
                console.warn('Sem permissão para salvar na pasta de backup automático em background.');
            }
        }

        // Fallback: Standard Download (Works on Mobile/Unsupported devices or if permission failed)
        if (!savedToDir) {
            console.log(`Usando método de fallback (download padrão) para o backup automático: ${filename}`);
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        localStorage.setItem('arf_last_auto_backup', date.toISOString());
        return true;
    } catch (err: any) {
        console.error('Erro ao realizar backup automático:', err);
        // Let it fail silently from the user's perspective if it's a background task, just log it.
        return false;
    }
}
