import json
import os
import sqlite3
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
THABO = json.load(open(os.path.join(ROOT, "fixtures", "thabo_full_resume.json"), encoding="utf-8"))
LERATO = json.load(open(os.path.join(ROOT, "fixtures", "lerato_sales_resume.json"), encoding="utf-8"))
DB = os.path.join(os.environ["TEMP"], "RKStorage.bin")

THABO["visibility"] = {
    "pd_contact_phone": False,
    "exp_1": False,
    "job_2": False,
    "section_hobbies": False,
    "skills_Soft": False,
    "skills_soft": False,
}

MAIN_UI = {
    "TechFormat": "list",
    "SoftFormat": "list",
    "NameCase": "title",
    "Layout": "professional",
    "isMain": True,
    "visibility_flags": {},
    "ContactSeparator": "dot",
}

TARGETED_UI = {
    "TechFormat": "comma",
    "SoftFormat": "comma",
    "NameCase": "upper",
    "Layout": "professional",
    "isMain": False,
    "visibility_flags": THABO["visibility"],
    "visibility": THABO["visibility"],
    "ContactSeparator": "pipe",
}

ALICE = "prof_demo_1"
BOB = "prof_demo_2"
MASTER_ID = "res_1790539140287"
LERATO_ID = "res_1786099657696"
NOW = int(time.time() * 1000)

THABO["id"] = MASTER_ID
LERATO["id"] = LERATO_ID

con = sqlite3.connect(DB)
cur = con.cursor()


def put(key, value):
    raw = json.dumps(value, ensure_ascii=False)
    cur.execute(
        "INSERT INTO catalystLocalStorage(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (key, raw),
    )


put(f"neltz_jobready_resume_data_{ALICE}_{MASTER_ID}", THABO)
put(
    f"neltz_jobready_resume_meta_{ALICE}",
    [{"id": MASTER_ID, "name": "Thabo Master CV", "lastModified": NOW}],
)
put(f"neltz_jobready_ui_settings_{ALICE}_{MASTER_ID}", MAIN_UI)

put(f"neltz_jobready_resume_data_{BOB}_{LERATO_ID}", LERATO)
put(
    f"neltz_jobready_resume_meta_{BOB}",
    [{"id": LERATO_ID, "name": "Lerato Sales CV", "lastModified": NOW}],
)
put(f"neltz_jobready_ui_settings_{BOB}_{LERATO_ID}", MAIN_UI)
put("neltz_jobready_last_active_id", ALICE)
con.commit()
con.close()
print("injected Alice/Thabo Main+Targeted flags and Bob/Lerato Main")
