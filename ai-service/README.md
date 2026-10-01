# OmniRev AI Service

Servizio Python separato dall'app Next.js per gli agenti di recupero
multi-ruolo (CrewAI / LangGraph / AutoGen), i guardrail privacy GDPR
(Presidio, LLM-Guard, scrubadub, Fides) e le proiezioni di cash flow
(Prophet, numpy-financial).

Stato: solo dipendenze dichiarate, nessun codice ancora. Non è collegato
all'app web né al deploy Vercel.

## Setup

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Il set completo pesa diversi GB (torch, spaCy, prophet/cmdstan) e alcune
librerie fissano versioni incompatibili tra loro (in particolare crewai,
pyautogen e nemoguardrails): conviene installarle per gruppi, in ambienti
separati se necessario.

Variabili d'ambiente: `ANTHROPIC_API_KEY` (vedi `.env.example` nella root).
