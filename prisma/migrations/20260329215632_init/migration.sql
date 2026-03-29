-- CreateTable
CREATE TABLE "device" (
    "uid" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,
    "model" VARCHAR(256) NOT NULL,
    "display_name" VARCHAR(256),

    CONSTRAINT "device_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "device_info" (
    "id" SERIAL NOT NULL,
    "device_uid" INTEGER NOT NULL,
    "bl_git" VARCHAR(256) NOT NULL,
    "bl_status" INTEGER NOT NULL,
    "app_git" VARCHAR(256) NOT NULL,
    "app_ver" INTEGER NOT NULL,
    "mcu" VARCHAR(256) NOT NULL,

    CONSTRAINT "device_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_config" (
    "id" SERIAL NOT NULL,
    "device_uid" INTEGER NOT NULL,
    "apn" VARCHAR(256) NOT NULL DEFAULT '',
    "url_ota" VARCHAR(256) NOT NULL,
    "url_app" VARCHAR(256) NOT NULL,
    "period_upload" INTEGER NOT NULL,
    "period_sensors" INTEGER NOT NULL,
    "period_anemometer" INTEGER NOT NULL,

    CONSTRAINT "device_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_pending_config" (
    "id" SERIAL NOT NULL,
    "device_uid" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apn" VARCHAR(256) NOT NULL DEFAULT '',
    "url_ota" VARCHAR(256) NOT NULL,
    "url_app" VARCHAR(256) NOT NULL,
    "period_upload" INTEGER NOT NULL,
    "period_sensors" INTEGER NOT NULL,
    "period_anemometer" INTEGER NOT NULL,

    CONSTRAINT "device_pending_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_cnet" (
    "id" SERIAL NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_uid" INTEGER NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "mcc" INTEGER NOT NULL,
    "mnc" INTEGER NOT NULL,
    "lac" INTEGER NOT NULL,
    "cid" INTEGER NOT NULL,
    "lev" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "device_cnet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_status" (
    "id" SERIAL NOT NULL,
    "device_uid" INTEGER NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "ticks" BIGINT NOT NULL,
    "tamper" BOOLEAN NOT NULL,
    "records_count" INTEGER NOT NULL,

    CONSTRAINT "device_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_record" (
    "id" SERIAL NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_uid" INTEGER NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "wind_direction" DOUBLE PRECISION NOT NULL,
    "wind_speed_avg" INTEGER NOT NULL,
    "wind_speed_min" INTEGER NOT NULL,
    "wind_speed_max" INTEGER NOT NULL,

    CONSTRAINT "sensor_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firmware_assignment" (
    "device_uid" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filename" VARCHAR(256) NOT NULL,

    CONSTRAINT "firmware_assignment_pkey" PRIMARY KEY ("device_uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_info_device_uid_key" ON "device_info"("device_uid");

-- CreateIndex
CREATE UNIQUE INDEX "device_config_device_uid_key" ON "device_config"("device_uid");

-- CreateIndex
CREATE UNIQUE INDEX "device_pending_config_device_uid_key" ON "device_pending_config"("device_uid");

-- CreateIndex
CREATE UNIQUE INDEX "firmware_assignment_device_uid_key" ON "firmware_assignment"("device_uid");

-- AddForeignKey
ALTER TABLE "device_info" ADD CONSTRAINT "device_info_device_uid_fkey" FOREIGN KEY ("device_uid") REFERENCES "device"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_config" ADD CONSTRAINT "device_config_device_uid_fkey" FOREIGN KEY ("device_uid") REFERENCES "device"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_pending_config" ADD CONSTRAINT "device_pending_config_device_uid_fkey" FOREIGN KEY ("device_uid") REFERENCES "device"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_cnet" ADD CONSTRAINT "device_cnet_device_uid_fkey" FOREIGN KEY ("device_uid") REFERENCES "device"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status" ADD CONSTRAINT "device_status_device_uid_fkey" FOREIGN KEY ("device_uid") REFERENCES "device"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_record" ADD CONSTRAINT "sensor_record_device_uid_fkey" FOREIGN KEY ("device_uid") REFERENCES "device"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmware_assignment" ADD CONSTRAINT "firmware_assignment_device_uid_fkey" FOREIGN KEY ("device_uid") REFERENCES "device"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
