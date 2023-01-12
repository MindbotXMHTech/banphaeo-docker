CREATE TABLE users
(
    user_id             serial not null,
    name                text not null,
    surname             text not null,
    email               text not null,
    password            text not null,
    tel_number          text not null,
    role                text not null,
    otp                 json NOT NULL DEFAULT '{}'::json,
    registration_date   TIMESTAMP WITH TIME ZONE DEFAULT now(),

    constraint pk_users primary key (user_id)
);

CREATE TABLE login_records
(
    login_id            serial not null,
    machine_no          integer not null,
    login_date          TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    user_id             serial not null,

    constraint pk_login_records primary key (login_id),
    constraint fk_login_records_user_id foreign key (user_id) references users (user_id)

);

CREATE TABLE prescription_records
(
    prescript_id        serial not null,
    prescript_no        text not null,
    waiting_queue       text not null,
    patient_name        text not null,
    hn                  text not null,
    age                 integer not null,
    hospital_unit       text not null,
    submit_date         TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    login_id            serial not null,

    CONSTRAINT pk_prescription_records PRIMARY KEY (prescript_id),
    CONSTRAINT fk_prescription_records_login_id FOREIGN KEY (login_id) references login_records (login_id)
);

CREATE TABLE medicine_records
(
    medical_id          serial not null,
    med_name            text not null,
    dose                integer not null,
    doctor              text not null,          
    status              boolean,
    submit_date         TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    prescript_id        serial not null,

    CONSTRAINT pk_medicine_records PRIMARY KEY (medical_id),
    CONSTRAINT fk_medicine_records_prescription_id FOREIGN KEY (prescript_id) references prescription_records (prescript_id)
);