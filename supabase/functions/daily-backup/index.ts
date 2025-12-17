import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TABLES_TO_BACKUP = [
  'orders',
  'order_items', 
  'customers',
  'products',
  'categories',
  'reservations',
  'tables',
  'restaurant_settings'
];

const RETENTION_DAYS = 7;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[daily-backup] Starting backup process...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    // Create client with service role for full access
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all tables data
    const backupData: Record<string, unknown[]> = {};
    const stats: Record<string, number> = {};

    for (const table of TABLES_TO_BACKUP) {
      console.log(`[daily-backup] Fetching table: ${table}`);
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`[daily-backup] Error fetching ${table}:`, error.message);
        backupData[table] = [];
        stats[table] = 0;
      } else {
        backupData[table] = data || [];
        stats[table] = data?.length || 0;
        console.log(`[daily-backup] Fetched ${stats[table]} rows from ${table}`);
      }
    }

    // Create backup object
    const timestamp = new Date().toISOString();
    const backup = {
      timestamp,
      version: '1.0',
      tables: backupData,
      stats,
      totalRecords: Object.values(stats).reduce((a, b) => a + b, 0)
    };

    // Generate filename with date
    const dateStr = timestamp.split('T')[0]; // YYYY-MM-DD
    const filename = `backup-${dateStr}.json`;

    console.log(`[daily-backup] Uploading backup as: ${filename}`);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(filename, JSON.stringify(backup, null, 2), {
        contentType: 'application/json',
        upsert: true // Overwrite if same day
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log(`[daily-backup] Backup uploaded successfully: ${filename}`);

    // Clean up old backups (older than RETENTION_DAYS)
    console.log(`[daily-backup] Cleaning up backups older than ${RETENTION_DAYS} days...`);
    
    const { data: files, error: listError } = await supabase.storage
      .from('backups')
      .list();

    if (listError) {
      console.error('[daily-backup] Error listing files:', listError.message);
    } else if (files) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
      
      const oldFiles = files.filter(file => {
        // Extract date from filename: backup-YYYY-MM-DD.json
        const match = file.name.match(/backup-(\d{4}-\d{2}-\d{2})\.json/);
        if (!match) return false;
        const fileDate = new Date(match[1]);
        return fileDate < cutoffDate;
      });

      if (oldFiles.length > 0) {
        const filesToDelete = oldFiles.map(f => f.name);
        console.log(`[daily-backup] Deleting ${filesToDelete.length} old backups:`, filesToDelete);
        
        const { error: deleteError } = await supabase.storage
          .from('backups')
          .remove(filesToDelete);

        if (deleteError) {
          console.error('[daily-backup] Error deleting old files:', deleteError.message);
        } else {
          console.log('[daily-backup] Old backups deleted successfully');
        }
      } else {
        console.log('[daily-backup] No old backups to delete');
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[daily-backup] Backup completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        stats,
        totalRecords: backup.totalRecords,
        duration: `${duration}ms`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[daily-backup] Backup failed:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
