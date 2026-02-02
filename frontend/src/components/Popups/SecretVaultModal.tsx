import React, { useState, useEffect } from 'react';
import { Button, Dialog, TextInput, Typography, Banner } from '@neo4j-ndl/react';
import { LockClosedIconOutline } from '@neo4j-ndl/react/icons';
import { getSecrets, saveSecret } from '../../services/SecretAPI';

interface SecretVaultModalProps {
    open: boolean;
    onClose: () => void;
}

const SecretVaultModal: React.FC<SecretVaultModalProps> = ({ open, onClose }) => {
    const [secretName, setSecretName] = useState('');
    const [secretValue, setSecretValue] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
    const [existingSecrets, setExistingSecrets] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            fetchSecrets();
        }
    }, [open]);

    const fetchSecrets = async () => {
        try {
            const response = await getSecrets();
            if (response.data.status === 'Success') {
                setExistingSecrets(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching secrets:', error);
        }
    };

    const handleSave = async () => {
        if (!secretName || !secretValue) {
            setStatus({ type: 'danger', message: 'Both name and value are required.' });
            return;
        }

        try {
            const response = await saveSecret(secretName, secretValue);
            if (response.data.status === 'Success') {
                setStatus({ type: 'success', message: response.data.message });
                setSecretName('');
                setSecretValue('');
                fetchSecrets();
            } else {
                setStatus({ type: 'danger', message: response.data.error || 'Failed to save secret.' });
            }
        } catch (error) {
            setStatus({ type: 'danger', message: 'Network error.' });
        }
    };

    return (
        <Dialog isOpen={open} onClose={onClose} size="small">
            <Dialog.Header>
                <div className="flex items-center gap-2">
                    <LockClosedIconOutline className="n-size-token-7" />
                    <Typography variant="h3">Secret Vault</Typography>
                </div>
            </Dialog.Header>
            <Dialog.Content className="flex flex-col gap-4">
                <Typography variant="body-medium">
                    Store your API keys securely in the encrypted vault. These will be used by the backend as overrides for environment variables.
                </Typography>

                {status && (
                    <Banner type={status.type} isCloseable onClose={() => setStatus(null)}>
                        {status.message}
                    </Banner>
                )}

                <TextInput
                    label="Secret Name (e.g., OPENAI_API_KEY)"
                    value={secretName}
                    onChange={(e) => setSecretName(e.target.value)}
                    placeholder="ENTER_SECRET_NAME"
                    isFluid
                />
                <TextInput
                    label="Secret Value"
                    htmlAttributes={{ type: 'password' }}
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    placeholder="••••••••••••••••"
                    isFluid
                />

                <div className="mt-2 text-right">
                    <Button onClick={handleSave}>Save Secret</Button>
                </div>

                <div className="mt-4">
                    <Typography variant="subheading-medium">Configured Secrets:</Typography>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {existingSecrets.length > 0 ? (
                            existingSecrets.map((key) => (
                                <div key={key} className="bg-palette-neutral-bg-strong px-2 py-1 rounded-md flex items-center gap-2 border border-neutral-border-strong">
                                    <Typography variant="body-small">{key}</Typography>
                                    <LockClosedIconOutline className="n-size-token-4 text-success" />
                                </div>
                            ))
                        ) : (
                            <Typography variant="body-small">No secrets configured yet.</Typography>
                        )}
                    </div>
                </div>
            </Dialog.Content>
            <Dialog.Actions>
                <Button onClick={onClose} fill="text">Close</Button>
            </Dialog.Actions>
        </Dialog>
    );
};

export default SecretVaultModal;
