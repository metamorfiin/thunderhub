import { recoverFundsFromChannels } from 'ln-service';
import { logger } from '../../../helpers/logger';
import { requestLimiter } from '../../../helpers/rateLimiter';
import { GraphQLNonNull, GraphQLString, GraphQLBoolean } from 'graphql';
import { getAuthLnd, getErrorMsg } from '../../../helpers/helpers';
import { AuthType } from '../../../schemaTypes/Auth';

interface BackupProps {
    backup: string;
}

export const recoverFunds = {
    type: GraphQLBoolean,
    args: {
        auth: { type: new GraphQLNonNull(AuthType) },
        backup: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: async (root: any, params: any, context: any) => {
        await requestLimiter(context.ip, 'recoverFunds');

        const lnd = getAuthLnd(params.auth);

        let backupObj: BackupProps = { backup: '' };
        try {
            backupObj = JSON.parse(params.backup);
        } catch (error) {
            logger.error('Corrupt backup file: %o', error);
            throw new Error('Corrupt backup file');
        }

        const { backup } = backupObj;

        try {
            await recoverFundsFromChannels({
                lnd,
                backup,
            });
            return true;
        } catch (error) {
            logger.error('Error recovering funds from channels: %o', error);
            throw new Error(getErrorMsg(error));
        }
    },
};
