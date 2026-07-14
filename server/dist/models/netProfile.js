/* hamlive-oss — MIT License. See LICENSE. */
const { modelMaker } = require('../lib/modelMaker');
const { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const netProfileSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Net Title Required'],
            unique: true,
            minlength: 4,
            maxlength: 25,
            validate: {
                validator: function (v) {
                    return /^\w+(?:[&.'\- ]*\w+)*$/.test(v);
                },
                message: 'net title format did not pass validation'
            }
        },
        frequency: {
            type: String,
            maxlength: 20,
            validate: {
                validator: function (v) {
                    if (v === '') {
                        return true;
                    }
                    return /^\d+[.]\d+(?:([.]\d+))?$/.test(v);
                },
                message: 'frequency format did not pass validation'
            }
        },
        mode: {
            type: String,
            enum: {
                values: [
                    'LSB',
                    'USB',
                    'AM',
                    'CW',
                    'FM',
                    'RTTY',
                    'FSQ',
                    'PSK-31',
                    'FreeDV',
                    'Reflector',
                    'Olivia',
                    'Hell',
                    'JS8Call',
                    'CUSTOM'
                ],
                message: '{VALUE} not in valid mode list'
            },
            required: [true, 'Mode Required']
        },
        modeDetails: {
            type: String,
            required: false,
            maxlength: 15,
            validate: {
                validator: function (v) {
                    if (v === '') {
                        return true;
                    }
                    return /^\w+(?:[&. ]*\w+)*$/.test(v);
                },
                message: 'mode details contains invalid characters'
            }
        },
        notes: {
            type: String,
            required: false,
            maxlength: 320,
            default: ''
        },
        owners: [
            {
                type: Schema.Types.ObjectId,
                ref: 'UserProfile',
                required: [true, 'user upid for owners required']
            }
        ],
        followers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'UserProfile'
            }
        ],
        liveNet: {
            type: Schema.Types.ObjectId,
            ref: 'LiveNet'
        },
        autoIn: { type: Boolean, default: false },
        permanent: { type: Boolean, default: false },
        restrictedSigReports: { type: Boolean, default: false },
        invisible: { type: Boolean, default: false },
        // Optional weekly schedule, expressed in UTC (ham convention; avoids
        // per-profile timezone bookkeeping). Drives the dashboard "Up next" list.
        schedule: [
            {
                dayOfWeekUtc: {
                    type: Number,
                    min: 0,
                    max: 6,
                    required: [true, 'dayOfWeekUtc (0=Sunday) required in schedule entry']
                },
                timeUtc: {
                    type: String,
                    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'timeUtc must be HH:MM (24h UTC)'],
                    required: [true, 'timeUtc required in schedule entry']
                }
            }
        ]
    },
    { timestamps: true }
);

netProfileSchema.plugin(uniqueValidator, {
    message: 'A net already exists with this name'
});

module.exports = {
    getNetProfile: db => modelMaker({ db, m: 'NetProfile', s: netProfileSchema }),
    netProfileSchema
};
