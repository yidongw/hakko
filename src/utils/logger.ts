import { pino } from 'pino'
import { config } from '@/config'

let instance: pino.Logger
/* eslint no-console: "off" */

export const logger = () => {
  if (instance) {
    return instance
  }
  instance = pino({
    timestamp: pino.stdTimeFunctions.isoTime,

    level: config.logLevel,
    transport: {
      targets: [
        ...(config.env === 'development'
          ? [
              {
                target: 'pino-pretty',
                level: config.logLevel,
                options: {
                  ignore: 'pid,hostname',
                  colorize: true,
                  translateTime: true
                }
              }
            ]
          : [
              {
                target: 'pino/file',
                level: config.logLevel,
                options: {}
              }
            ])
      ]
    }
  })
  return instance
}

export type Logger = typeof logger
