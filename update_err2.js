const fs = require('fs');
let file = fs.readFileSync('src/app/(app)/profile/[username]/page.tsx', 'utf8');

file = file.replace(
`      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', { p_user1_id: myProfile.id, p_user2_id: targetProfile.id });
      if (error) throw error;
      router.push('/chat/' + data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start chat');
      console.error(error);
    } finally {`,
`      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', { p_user1_id: myProfile.id, p_user2_id: targetProfile.id });
      if (error) throw error;
      router.push('/chat/' + data);
    } catch (error: any) {
      toast.error(JSON.stringify(error) || error.message || 'Failed to start chat');
      console.error(error);
    } finally {`
);

fs.writeFileSync('src/app/(app)/profile/[username]/page.tsx', file);
