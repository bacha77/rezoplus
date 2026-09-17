import { db, insertCarrierHistory, getAllAlertSettings } from './db';
import { fetchFMCSAStatus } from './fmcsa';
import { sendSlackAlert, sendUserEmailAlert } from './alerts';

export const runPollingLogic = async () => {
  console.log('[Poller] Starting FMCSA carrier update poll...');

  try {
    const result = await db.execute('SELECT * FROM carriers');
    const carriers = result.rows;

    for (const carrier of carriers) {
      try {
        const newStatus = await fetchFMCSAStatus(carrier.dot_number as string);
        
        let statusChangedTo: string | null = null;
        if (carrier.insurance_status === 'ACTIVE' && newStatus.insurance_status === 'DROPPED') {
          statusChangedTo = 'INSURANCE DROPPED';
        } else if (carrier.authority_status === 'AUTHORIZED' && newStatus.authority_status === 'REVOKED') {
          statusChangedTo = 'AUTHORITY REVOKED';
        }

        if (statusChangedTo) {
          const msg = `🚨 *URGENT COMPLIANCE ALERT* 🚨\nCarrier: ${carrier.name} (DOT: ${carrier.dot_number})\nStatus: ${statusChangedTo}!`;
          await sendSlackAlert(msg);
          
          // Fetch users who want email alerts and send to each
          const alertSettings = await getAllAlertSettings();
          for (const setting of alertSettings) {
             await sendUserEmailAlert(setting.alert_email, carrier.name as string, carrier.dot_number as string, statusChangedTo);
          }
        }

        // Update main record
        await db.execute({
          sql: 'UPDATE carriers SET insurance_status = ?, authority_status = ?, safety_score = ?, last_checked = CURRENT_TIMESTAMP WHERE id = ?',
          args: [newStatus.insurance_status, newStatus.authority_status, newStatus.safety_score, carrier.id]
        });

        // Insert historical snapshot
        await insertCarrierHistory(
          carrier.id as number,
          newStatus.insurance_status,
          newStatus.authority_status,
          newStatus.safety_score
        );

      } catch (error) {
        console.error(`Failed to update carrier ${carrier.dot_number}:`, error);
      }
    }
    
    console.log('[Poller] Completed polling cycle.');
  } catch (err) {
    console.error('Failed to get carriers:', err);
    throw err;
  }
};
