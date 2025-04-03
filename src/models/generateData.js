import sequelize from '@/models/sequelize';
import { configsModel, servicesModel } from '@/models';
import { logger } from '@/utils';
import servicesData from '@/models/setupData/servicesData.json' with { type: 'json' };
import configsData from '@/models/setupData/configsData.json' with { type: 'json' };

const generate = async (modelLabel, model, data) => {
    try {
        await Promise.all(data.map((item) => model.upsert(item)));
        logger.info(`✅ ${modelLabel} seeded successfully`);
    } catch (error) {
        logger.error(`❌ Error seeding ${modelLabel}:`, error);
    }
};

const generateData = async () => {
    await generate('Services', servicesModel, servicesData);
    await generate('Configs', configsModel, configsData);
    // await generate('Model names/identity', model, data);
};

export default generateData;
