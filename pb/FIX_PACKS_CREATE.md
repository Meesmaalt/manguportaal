# packs 400 Failed to create record

## 1) Lehe konto, mitte PB admin

Logi sisse rakenduses `/mangud/login` (users), mitte ainult `8090/_/`.

## 2) API rules (packs)

- **Create:** `@request.auth.id != ""`
- **List/View:** `is_official = true || is_public = true || owner = @request.auth.id`
- **Update/Delete:** `owner = @request.auth.id`

## 3) owner relation

Field **owner** → Collection peab olema **users** (auth collection).

Kui importis oli `_pb_users_auth_` ja su PB-s on id `users`, relation on katki → 400 ilma detailideta.

**Admin → packs → owner → Collection = users** → Save.

## 4) Test API

Brauseri konsool (olles sisse logitud lehel):

```js
const pb = window.__pb // if exposed
```

Või Network tab: POST body + response JSON.
