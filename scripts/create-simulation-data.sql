-- =====================================================
-- MECORRIERON.MX - Datos de Simulacion
-- 100 cotizaciones/usuarios con casos aleatorios
-- Cadena de referidos desde superadmin
-- =====================================================

-- Arrays de datos aleatorios
DO $$
DECLARE
  -- Arrays de nombres
  nombres TEXT[] := ARRAY[
    'Juan', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Miguel', 'Sofia', 'Luis', 'Carmen',
    'Jorge', 'Patricia', 'Roberto', 'Fernanda', 'Ricardo', 'Gabriela', 'Fernando', 'Diana', 'Alejandro', 'Rosa',
    'Francisco', 'Claudia', 'Eduardo', 'Monica', 'Alberto', 'Sandra', 'Enrique', 'Veronica', 'Raul', 'Leticia',
    'Arturo', 'Adriana', 'Oscar', 'Alejandra', 'Marco', 'Elizabeth', 'Sergio', 'Karla', 'Rafael', 'Daniela',
    'Manuel', 'Jessica', 'Javier', 'Mariana', 'Antonio', 'Paola', 'Jose', 'Ivonne', 'David', 'Natalia'
  ];
  
  apellidos TEXT[] := ARRAY[
    'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Hernandez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
    'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Morales', 'Reyes', 'Ortiz', 'Gutierrez', 'Chavez',
    'Ruiz', 'Mendoza', 'Aguilar', 'Castillo', 'Jimenez', 'Moreno', 'Romero', 'Herrera', 'Medina', 'Vargas',
    'Castro', 'Guzman', 'Velazquez', 'Rojas', 'Contreras', 'Fuentes', 'Cordova', 'Espinoza', 'Salazar', 'Delgado'
  ];
  
-- Empresas reales de Mexico por estado (100 empresas)
  empresas TEXT[] := ARRAY[
    -- CDMX
    'Walmart de Mexico SAB de CV', 'Grupo Bimbo SAB de CV', 'America Movil SAB', 'BBVA Mexico SA', 'Liverpool SAB de CV',
    'Grupo Carso SAB de CV', 'Televisa SA de CV', 'Elektra SAB de CV', 'Grupo Sanborns', 'Palacio de Hierro',
    -- Nuevo Leon  
    'FEMSA SAB de CV', 'Cemex SAB de CV', 'Alfa SAB de CV', 'Banorte SAB de CV', 'Ternium Mexico SA',
    'Grupo Villacero SA', 'Xignux SA de CV', 'Gruma SAB de CV', 'Arca Continental', 'Axtel SAB',
    -- Jalisco
    'Jose Cuervo SA de CV', 'Grupo Modelo Guadalajara', 'Flexi SA de CV', 'Omnilife SA de CV', 'Continental Guadalajara',
    'HP Mexico SA de CV', 'Flextronics Guadalajara', 'Jabil Circuit', 'Intel Guadalajara', 'Oracle Mexico',
    -- Estado de Mexico
    'Coca-Cola FEMSA', 'Nestle Mexico SA', 'La Moderna SA', 'Herdez SA de CV', 'Jumex SA de CV',
    'Kimberly Clark Mexico', 'Colgate Palmolive', 'Procter and Gamble Mexico', 'Unilever Mexico', 'Danone Mexico',
    -- Guanajuato
    'General Motors de Mexico', 'Mazda Motor Mexico', 'Honda de Mexico', 'Volkswagen Guanajuato', 'Toyota Guanajuato',
    -- Puebla
    'Volkswagen de Mexico SA', 'Audi Mexico SA de CV', 'Farmacias del Ahorro', 'Textiles de Puebla SA', 'Mabe Puebla',
    -- Queretaro
    'Samsung Electronics Mexico', 'Kelloggs de Mexico', 'Bombardier Queretaro', 'Safran Mexico', 'ITP Aero Mexico',
    -- Coahuila
    'Stellantis Mexico (Chrysler)', 'General Motors Ramos Arizpe', 'Grupo Industrial Saltillo', 'AHMSA', 'Deacero',
    -- Chihuahua
    'Foxconn Mexico SA', 'Lexmark Mexico', 'Bosch Mexico SA', 'BRP Mexico SA', 'Honeywell Mexico',
    -- Baja California
    'Toyota Baja California', 'Hyundai Mexico', 'Samsung SDI Mexico', 'Skyworks Solutions', 'Plantronics Mexico',
    -- Sonora
    'Ford Motor Company Mexico', 'Grupo Mexico SAB', 'Bachoco SAB de CV', 'Minera Fresnillo', 'Tetakawi SA',
    -- Tamaulipas
    'Pemex Refineria Madero', 'LG Electronics Reynosa', 'Delphi Mexico SA', 'Aptiv Mexico', 'Caterpillar Mexico',
    -- Veracruz
    'Grupo Lala SAB', 'Cerveceria Modelo Orizaba', 'TAMSA SA de CV', 'Pemex Coatzacoalcos', 'Braskem Idesa',
    -- San Luis Potosi
    'BMW de Mexico SA', 'General Motors SLP', 'Continental Automotive', 'ZF Friedrichshafen', 'Cummins Mexico',
    -- Aguascalientes
    'Nissan Mexicana SA', 'Texas Instruments Mexico', 'Flextronics Aguascalientes', 'Sensata Technologies', 'Jatco Mexico',
    -- Yucatan
    'Grupo Kuo SAB', 'Bachoco Yucatan', 'Cerveceria Yucateca', 'Grupo Bepensa', 'Megamedia Yucatan',
    -- Quintana Roo
    'Grupo Xcaret SA', 'Palace Resorts', 'Hotel Riu Cancun', 'Hard Rock Hotel Cancun', 'Barcelo Maya',
    -- Sinaloa
    'Grupo Coppel SA de CV', 'Casa Ley SA de CV', 'Sukarne SA de CV', 'Bachoco Sinaloa', 'SuKarne',
    -- Michoacan
    'Mission Produce Mexico', 'ArcelorMittal Lazaro Cardenas', 'Avocados from Mexico', 'West Pak Avocado', 'Calavo Mexico',
    -- Otros estados
    'Fresnillo PLC Mexico', 'Penoles SAB de CV', 'Pemex Campeche', 'Schlumberger Mexico', 'Halliburton Mexico'
  ];
  
  puestos TEXT[] := ARRAY[
    'Cajero', 'Vendedor', 'Almacenista', 'Repartidor', 'Cocinero',
    'Mesero', 'Recepcionista', 'Guardia de seguridad', 'Limpieza', 'Chofer',
    'Auxiliar administrativo', 'Ejecutivo de ventas', 'Supervisor', 'Gerente de tienda', 'Encargado de turno',
    'Operador de produccion', 'Tecnico de mantenimiento', 'Electricista', 'Mecanico', 'Soldador',
    'Ayudante general', 'Promotor', 'Demostrador', 'Asesor de servicio', 'Agente de call center',
    'Contador', 'Recursos humanos', 'Analista', 'Programador', 'Diseñador'
  ];
  
  -- Todos los 32 estados de Mexico
  estados TEXT[] := ARRAY[
    'Ciudad de Mexico', 'Estado de Mexico', 'Jalisco', 'Nuevo Leon', 'Puebla',
    'Guanajuato', 'Chihuahua', 'Michoacan', 'Veracruz', 'Baja California',
    'Tamaulipas', 'Coahuila', 'Sinaloa', 'Sonora', 'Queretaro',
    'Hidalgo', 'Morelos', 'Aguascalientes', 'Yucatan', 'Quintana Roo',
    'San Luis Potosi', 'Oaxaca', 'Tabasco', 'Chiapas', 'Guerrero',
    'Durango', 'Zacatecas', 'Nayarit', 'Tlaxcala', 'Colima',
    'Campeche', 'Baja California Sur'
  ];
  
  ciudades TEXT[] := ARRAY[
    'Centro', 'Norte', 'Sur', 'Oriente', 'Poniente',
    'Industrial', 'Zona Centro', 'Periferico', 'Zona Metropolitana', 'Downtown'
  ];
  
  motivos_despido TEXT[] := ARRAY[
    'Despido injustificado sin liquidacion',
    'Reduccion de salario sin previo aviso',
    'No pago de horas extra trabajadas',
    'Despido por embarazo',
    'Acoso laboral constante',
    'No pago de aguinaldo',
    'No pago de vacaciones',
    'Despido por enfermedad',
    'No alta en IMSS',
    'Reduccion de jornada forzada',
    'Cambio de puesto sin consentimiento',
    'No pago de utilidades',
    'Despido verbal sin aviso',
    'Hostigamiento por parte del jefe',
    'Discriminacion en el trabajo'
  ];
  
  -- Variables de control
  i INTEGER;
  nuevo_user_id UUID;
  nuevo_caso_id UUID;
  nombre_completo TEXT;
  email_usuario TEXT;
  telefono TEXT;
  estado_random TEXT;
  ciudad_random TEXT;
  empresa_random TEXT;
  puesto_random TEXT;
  motivo_random TEXT;
  salario_random DECIMAL;
  antiguedad_random INTEGER;
  tiene_pruebas BOOLEAN;
  tiene_imss BOOLEAN;
  tiene_contrato BOOLEAN;
  status_caso TEXT;
  monto_estimado DECIMAL;
  fecha_despido DATE;
  referido_por UUID;
  ultimo_referido UUID;
  superadmin_id UUID;
  lawyer_test_id UUID;
  admin_test_id UUID;
  
BEGIN
  -- Obtener IDs de usuarios de prueba existentes
  SELECT id INTO superadmin_id FROM auth.users WHERE email = 'superadmin123@mecorrieron.mx';
  SELECT id INTO lawyer_test_id FROM auth.users WHERE email = 'abogado123@mecorrieron.mx';
  SELECT id INTO admin_test_id FROM auth.users WHERE email = 'admin123@mecorrieron.mx';
  
  -- Si no existen, usar NULL (se crearan despues)
  IF superadmin_id IS NULL THEN
    superadmin_id := gen_random_uuid();
  END IF;
  
  -- El primer referido es superadmin
  ultimo_referido := superadmin_id;
  
  -- Crear 100 usuarios con casos
  FOR i IN 1..100 LOOP
    -- Generar datos aleatorios
    nombre_completo := nombres[1 + floor(random() * array_length(nombres, 1))::int] || ' ' || 
                       apellidos[1 + floor(random() * array_length(apellidos, 1))::int] || ' ' ||
                       apellidos[1 + floor(random() * array_length(apellidos, 1))::int];
    
    email_usuario := 'test.worker' || i || '@mecorrieron.mx';
    telefono := '55' || lpad((floor(random() * 100000000)::bigint)::text, 8, '0');
    estado_random := estados[1 + floor(random() * array_length(estados, 1))::int];
    ciudad_random := ciudades[1 + floor(random() * array_length(ciudades, 1))::int];
    empresa_random := empresas[1 + floor(random() * array_length(empresas, 1))::int];
    puesto_random := puestos[1 + floor(random() * array_length(puestos, 1))::int];
    motivo_random := motivos_despido[1 + floor(random() * array_length(motivos_despido, 1))::int];
    salario_random := 5000 + floor(random() * 45000);
    antiguedad_random := 1 + floor(random() * 120);
    tiene_pruebas := random() > 0.3;
    tiene_imss := random() > 0.4;
    tiene_contrato := random() > 0.5;
    fecha_despido := CURRENT_DATE - (floor(random() * 180)::int);
    
    -- Calcular monto estimado basado en antiguedad y salario
    monto_estimado := salario_random * (3 + (antiguedad_random / 12.0) * 0.5);
    
    -- Asignar status aleatorio con distribucion realista
    CASE 
      WHEN random() < 0.4 THEN status_caso := 'draft';      -- 40% cotizaciones sin completar
      WHEN random() < 0.7 THEN status_caso := 'open';       -- 30% abiertos esperando
      WHEN random() < 0.85 THEN status_caso := 'prequalified'; -- 15% precalificados
      WHEN random() < 0.95 THEN status_caso := 'assigned';  -- 10% asignados
      ELSE status_caso := 'in_progress';                    -- 5% en progreso
    END CASE;
    
    -- Cadena de referidos: cada usuario refiere al siguiente
    -- Cada 10 usuarios, el referido vuelve a ser el superadmin
    IF i % 10 = 1 THEN
      referido_por := superadmin_id;
    ELSE
      referido_por := ultimo_referido;
    END IF;
    
    -- Generar UUID para el nuevo usuario
    nuevo_user_id := gen_random_uuid();
    
    -- Crear usuario en auth.users (simulado - en produccion esto seria via signup)
    -- Por ahora solo creamos el perfil
    
    -- Crear perfil
    INSERT INTO profiles (
      id, 
      email, 
      full_name, 
      phone, 
      role, 
      verification_status,
      created_at,
      referred_by
    ) VALUES (
      nuevo_user_id,
      email_usuario,
      nombre_completo,
      telefono,
      CASE WHEN random() > 0.7 THEN 'worker' ELSE 'guest' END,
      CASE 
        WHEN random() > 0.8 THEN 'verified'
        WHEN random() > 0.5 THEN 'pending'
        ELSE 'unverified'
      END,
      NOW() - (interval '1 day' * floor(random() * 90)),
      referido_por
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Si el usuario tiene status 'open' o mayor, crear caso
    IF status_caso != 'draft' OR random() > 0.3 THEN
      INSERT INTO casos (
        id,
        worker_id,
        lawyer_id,
        status,
        empresa_nombre,
        empresa_rfc,
        ciudad,
        estado,
        monto_estimado,
        metadata,
        created_at
      ) VALUES (
        gen_random_uuid(),
        nuevo_user_id,
        CASE WHEN status_caso IN ('assigned', 'in_progress') THEN lawyer_test_id ELSE NULL END,
        status_caso,
        empresa_random,
        UPPER(SUBSTRING(MD5(empresa_random) FROM 1 FOR 3)) || lpad((floor(random() * 1000000)::int)::text, 6, '0') || UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 3)),
        ciudad_random,
        estado_random,
        monto_estimado,
        jsonb_build_object(
          'puesto', puesto_random,
          'salario_mensual', salario_random,
          'antiguedad_meses', antiguedad_random,
          'motivo_despido', motivo_random,
          'fecha_despido', fecha_despido,
          'tiene_pruebas', tiene_pruebas,
          'tiene_imss', tiene_imss,
          'tiene_contrato', tiene_contrato,
          'fuente', 'simulacion',
          'ip_registro', '192.168.1.' || (1 + floor(random() * 254)::int)
        ),
        NOW() - (interval '1 day' * floor(random() * 60))
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Actualizar el ultimo referido para la cadena
    ultimo_referido := nuevo_user_id;
    
  END LOOP;
  
  -- Crear algunos casos mas completos para los usuarios que ya tienen perfil verificado
  -- Estos son los que estan listos para asignar a un abogado
  
  -- Actualizar 20 casos aleatorios a status 'prequalified' (listos para asignar)
  UPDATE casos 
  SET 
    status = 'prequalified',
    prequalified_at = NOW() - (interval '1 hour' * floor(random() * 48)),
    intake_submitted = true,
    intake_submitted_at = NOW() - (interval '1 hour' * floor(random() * 72))
  WHERE id IN (
    SELECT id FROM casos 
    WHERE status = 'open' 
    ORDER BY random() 
    LIMIT 20
  );
  
  -- Crear ofertas de caso para casos prequalified
  INSERT INTO case_offers (case_id, state, city, status, opened_at, expires_at)
  SELECT 
    c.id,
    c.estado,
    c.ciudad,
    'open',
    NOW() - (interval '1 hour' * floor(random() * 24)),
    NOW() + (interval '1 day' * (1 + floor(random() * 3)))
  FROM casos c
  WHERE c.status = 'prequalified'
  AND NOT EXISTS (SELECT 1 FROM case_offers WHERE case_id = c.id)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Simulacion completada: 100 usuarios y casos creados';
  
END $$;

-- Verificar resultados
SELECT 
  'Profiles' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE role = 'guest') as guests,
  COUNT(*) FILTER (WHERE role = 'worker') as workers
FROM profiles
WHERE email LIKE 'test.worker%'

UNION ALL

SELECT 
  'Casos' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'draft') as drafts,
  COUNT(*) FILTER (WHERE status IN ('open', 'prequalified', 'assigned')) as activos
FROM casos
WHERE worker_id IN (SELECT id FROM profiles WHERE email LIKE 'test.worker%');
