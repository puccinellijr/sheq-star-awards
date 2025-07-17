-- Remove duplicate user "Luciana - TI" 
DELETE FROM profiles 
WHERE user_id = '2088462d-826e-4781-b1a4-1ae16162f3ce' 
  AND name = 'Luciana' 
  AND department = 'TI';